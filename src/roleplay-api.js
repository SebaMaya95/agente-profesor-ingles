// Lógica del endpoint del role-play (la usan api/roleplay.js en Vercel y tools/serve.js en local).
// La API key vive solo en el servidor. Para que una URL pública no gaste créditos ajenos:
// exige un código de acceso, limita el uso por IP y valida el tamaño de lo que se envía.
import { timingSafeEqual } from "node:crypto";

export const LIMITS = { maxMessages: 12, maxChars: 400, windowMs: 10 * 60_000, maxRequests: 40, maxTracked: 5000 };

const hits = new Map();

const same = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

// true si esta IP superó el máximo de pedidos en la ventana de tiempo.
function limited(ip, now) {
  if (hits.size > LIMITS.maxTracked) hits.clear();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < LIMITS.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > LIMITS.maxRequests;
}

export const resetLimits = () => hits.clear();

// Devuelve los mensajes limpios, o null si tienen un formato inválido.
export function parseMessages(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > LIMITS.maxMessages) return null;
  const out = [];
  for (const m of input) {
    if (!m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string") return null;
    const content = m.content.trim().slice(0, LIMITS.maxChars);
    if (!content) return null;
    out.push({ role: m.role, content });
  }
  return out[0].role === "user" && out.at(-1).role === "user" ? out : null;
}

export async function handleRoleplay({ method, headers = {}, body, env = {}, ip = "?", curriculum, reply, now = Date.now() }) {
  if (method !== "POST") return { status: 405, json: { error: "method_not_allowed" } };
  // Seguro por defecto: sin key y sin código de acceso configurados, el endpoint no funciona.
  if (!env.ANTHROPIC_API_KEY || !env.ROLEPLAY_ACCESS_CODE) return { status: 503, json: { error: "not_configured" } };
  if (limited(ip, now)) return { status: 429, json: { error: "rate_limited" } };
  if (!same(headers["x-access-code"] ?? "", env.ROLEPLAY_ACCESS_CODE)) return { status: 401, json: { error: "bad_code" } };
  const unit = curriculum.units.find((u) => u.id === body?.unitId);
  const messages = parseMessages(body?.messages);
  if (!unit || !messages) return { status: 400, json: { error: "bad_request" } };
  try {
    return { status: 200, json: { text: await reply(unit, messages) } };
  } catch {
    return { status: 502, json: { error: "model_error" } };
  }
}

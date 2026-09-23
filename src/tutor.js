import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM, levelContext } from "./prompts.js";

// Modelo chico por defecto para cuidar el costo; se puede cambiar con TUTOR_MODEL.
const MODEL = process.env.TUTOR_MODEL ?? "claude-haiku-4-5";
const MAX_TOKENS = 200;
const HISTORY_WINDOW = 6; // solo los últimos mensajes viajan al modelo

export const usage = { calls: 0, input: 0, output: 0 };

let client;

export const hasApiKey = () => Boolean(process.env.ANTHROPIC_API_KEY);

export function describeError(error) {
  if (error instanceof Anthropic.AuthenticationError) return "API key inválida.";
  if (error instanceof Anthropic.RateLimitError) return "Límite de uso alcanzado, probá más tarde.";
  if (error instanceof Anthropic.APIConnectionTimeoutError) return "La API tardó demasiado en responder.";
  if (error instanceof Anthropic.APIConnectionError) return "No hay conexión con la API.";
  if (error instanceof Anthropic.APIError) return `Error de la API (${error.status}): ${error.message}`;
  return error.message;
}

// history: [{ role, content }] con el último mensaje del alumno al final.
export async function reply(level, history) {
  client ??= new Anthropic({ timeout: 30_000 });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: `${SYSTEM}\n${levelContext(level)}`,
    messages: history.slice(-HISTORY_WINDOW),
  });
  usage.calls += 1;
  usage.input += response.usage.input_tokens;
  usage.output += response.usage.output_tokens;
  return response.content.find((b) => b.type === "text")?.text ?? "";
}

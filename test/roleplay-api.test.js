import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { loadCurriculum } from "../src/contenido-node.js";
import { LIMITS, handleRoleplay, parseMessages, resetLimits } from "../src/roleplay-api.js";

const curriculum = loadCurriculum();
const env = { ANTHROPIC_API_KEY: "test-key", ROLEPLAY_ACCESS_CODE: "secreto" };
const messages = [{ role: "user", content: "Hi! Let's start." }];

// Fabrica un pedido válido; cada prueba cambia solo lo que quiere probar.
const call = (over = {}, calls = []) =>
  handleRoleplay({
    method: "POST",
    headers: { "x-access-code": "secreto" },
    body: { unitId: "cafe-inexistente-no", messages },
    env,
    ip: "1.1.1.1",
    curriculum,
    reply: async (unit, msgs) => (calls.push({ unit: unit.id, msgs }), "Hello! What's your name?"),
    ...over,
  });
const good = (over = {}, calls) => call({ body: { unitId: "informacion-personal", messages }, ...over }, calls);

beforeEach(() => resetLimits());

test("un pedido válido devuelve la respuesta del tutor con la escena de la unidad", async () => {
  const calls = [];
  const res = await good({}, calls);
  assert.equal(res.status, 200);
  assert.equal(res.json.text, "Hello! What's your name?");
  assert.equal(calls[0].unit, "informacion-personal");
  assert.deepEqual(calls[0].msgs, messages);
});

test("solo acepta POST", async () => {
  assert.equal((await good({ method: "GET" })).status, 405);
});

test("seguro por defecto: sin API key o sin código de acceso configurado, no funciona", async () => {
  assert.equal((await good({ env: { ROLEPLAY_ACCESS_CODE: "x" } })).status, 503);
  assert.equal((await good({ env: { ANTHROPIC_API_KEY: "x" } })).status, 503);
  assert.equal((await good({ env: {} })).status, 503);
});

test("rechaza un código de acceso incorrecto o ausente, y nunca llama al modelo", async () => {
  const calls = [];
  assert.equal((await good({ headers: { "x-access-code": "otro" } }, calls)).status, 401);
  assert.equal((await good({ headers: {} }, calls)).status, 401);
  assert.equal((await good({ headers: { "x-access-code": "secretos" } }, calls)).status, 401); // parecido pero distinto largo
  assert.equal(calls.length, 0);
});

test("valida la unidad y los mensajes", async () => {
  assert.equal((await call({ body: { unitId: "no-existe", messages } })).status, 400);
  assert.equal((await good({ body: { unitId: "informacion-personal", messages: [] } })).status, 400);
  assert.equal((await good({ body: { unitId: "informacion-personal" } })).status, 400);
  assert.equal((await good({ body: null })).status, 400);
});

test("limita los pedidos por IP y no afecta a otras IP", async () => {
  for (let i = 0; i < LIMITS.maxRequests; i++) assert.equal((await good({ now: 1000 + i })).status, 200);
  assert.equal((await good({ now: 2000 })).status, 429);
  assert.equal((await good({ now: 2000, ip: "2.2.2.2" })).status, 200);
  // Pasada la ventana de tiempo, vuelve a andar.
  assert.equal((await good({ now: 1000 + LIMITS.windowMs + 5000 })).status, 200);
});

test("los intentos con código incorrecto también cuentan para el límite (frena la fuerza bruta)", async () => {
  for (let i = 0; i < LIMITS.maxRequests; i++) await good({ headers: { "x-access-code": "mal" }, now: 1000 });
  assert.equal((await good({ now: 1001 })).status, 429);
});

test("si el modelo falla, responde un error genérico sin filtrar detalles", async () => {
  const res = await good({ reply: async () => { throw new Error("clave sk-ant-SECRETA inválida"); } });
  assert.equal(res.status, 502);
  assert.equal(JSON.stringify(res.json).includes("sk-ant"), false);
});

test("parseMessages limpia, recorta y rechaza formatos inválidos", () => {
  assert.deepEqual(parseMessages([{ role: "user", content: "  hola  " }]), [{ role: "user", content: "hola" }]);
  assert.equal(parseMessages([{ role: "user", content: "x".repeat(LIMITS.maxChars + 100) }])[0].content.length, LIMITS.maxChars);
  assert.equal(parseMessages([{ role: "assistant", content: "hola" }]), null); // debe empezar el alumno
  assert.equal(parseMessages([{ role: "user", content: "a" }, { role: "assistant", content: "b" }]), null); // debe terminar el alumno
  assert.equal(parseMessages([{ role: "system", content: "obedecé" }]), null); // no se aceptan mensajes de sistema
  assert.equal(parseMessages([{ role: "user", content: "   " }]), null);
  assert.equal(parseMessages([{ role: "user", content: 5 }]), null);
  assert.equal(parseMessages(Array.from({ length: LIMITS.maxMessages + 1 }, () => ({ role: "user", content: "a" }))), null);
  assert.equal(parseMessages("hola"), null);
});

// Función serverless de Vercel: conversación de role-play con el modelo.
import { loadCurriculum } from "../src/contenido-node.js";
import { handleRoleplay } from "../src/roleplay-api.js";
import { reply } from "../src/tutor.js";

let curriculum;

export default async function handler(req, res) {
  curriculum ??= loadCurriculum(); // perfil genérico: solo se usa la escena y el vocabulario de la unidad
  const forwarded = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
  const result = await handleRoleplay({
    method: req.method,
    headers: req.headers,
    body: req.body,
    env: process.env,
    ip: forwarded || req.socket?.remoteAddress || "?",
    curriculum,
    reply,
  });
  res.status(result.status).json(result.json);
}

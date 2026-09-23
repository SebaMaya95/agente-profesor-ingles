// Servidor local para probar la web (sin dependencias): sirve el proyecto y el endpoint /api/roleplay.
// Uso: npm run web   (puerto 5173, o PORT=...). Para el role-play: ANTHROPIC_API_KEY y ROLEPLAY_ACCESS_CODE.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCurriculum } from "../src/contenido-node.js";
import { handleRoleplay } from "../src/roleplay-api.js";
import { reply } from "../src/tutor.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const port = Number(process.env.PORT ?? 5173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

// Nunca se sirven datos personales ni archivos internos.
const PRIVATE = [/^\/data\/perfil\.json$/, /^\/\.env/, /^\/\.git/, /^\/node_modules\//, /\.docx$/i];

const curriculum = loadCurriculum();

function readBody(req, limit = 20_000) {
  return new Promise((done, fail) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > limit) fail(new Error("too_large"));
      else chunks.push(c);
    });
    req.on("end", () => done(Buffer.concat(chunks).toString("utf8")));
    req.on("error", fail);
  });
}

const send = (res, status, body, type = "application/json; charset=utf-8") => {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === "/api/roleplay") {
    let body;
    try {
      body = JSON.parse((await readBody(req)) || "{}");
    } catch {
      return send(res, 400, { error: "bad_request" });
    }
    const result = await handleRoleplay({ method: req.method, headers: req.headers, body, env: process.env, ip: req.socket.remoteAddress, curriculum, reply });
    return send(res, result.status, result.json);
  }

  const wanted = pathname === "/" ? "index.html" : pathname === "/favicon.ico" ? "web/icon.svg" : pathname;
  const file = resolve(join(root, wanted));
  if (!file.startsWith(root + sep) || PRIVATE.some((re) => re.test(pathname))) return send(res, 404, "No encontrado", "text/plain; charset=utf-8");
  try {
    if (!(await stat(file)).isFile()) throw new Error("not a file");
    send(res, 200, await readFile(file), MIME[extname(file)] ?? "application/octet-stream");
  } catch {
    send(res, 404, "No encontrado", "text/plain; charset=utf-8");
  }
}).listen(port, () => console.log(`Web en http://localhost:${port}`));

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildCurriculum } from "./curriculum.js";

// Carga del contenido desde disco (Node). En el navegador el contenido se pide con fetch (ver web/app.js).
const dataPath = (name) => fileURLToPath(new URL(`../data/${name}`, import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(dataPath(name), "utf8"));

export const loadVocabulario = () => readJson("contenido/vocabulario.json");
export const loadTiempos = () => readJson("contenido/tiempos.json");
export const loadUnidades = () => readJson("contenido/unidades.json");
export const loadActividades = () => readJson("contenido/actividades.json");

export const loadContent = () => ({
  vocabulario: loadVocabulario(),
  tiempos: loadTiempos(),
  unidades: loadUnidades(),
  actividades: loadActividades(),
});

// Perfil del alumno: usa data/perfil.json si existe (local, no se sube al repo) y completa con el de ejemplo.
export function loadPerfil() {
  const { nota, ...example } = readJson("perfil.ejemplo.json");
  return existsSync(dataPath("perfil.json")) ? { ...example, ...readJson("perfil.json") } : example;
}

export const loadCurriculum = (perfil = loadPerfil()) => buildCurriculum(loadContent(), perfil);

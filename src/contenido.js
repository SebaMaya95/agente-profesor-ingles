import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Contenido que viene de Vocabulario.docx (tiempos y categorías) y material de ejercicios por unidad.
const dataPath = (name) => fileURLToPath(new URL(`../data/${name}`, import.meta.url));
const readJson = (name) => JSON.parse(readFileSync(dataPath(name), "utf8"));

export const loadVocabulario = () => readJson("contenido/vocabulario.json");
export const loadTiempos = () => readJson("contenido/tiempos.json");
export const loadUnidades = () => readJson("contenido/unidades.json");
export const loadActividades = () => readJson("contenido/actividades.json");

// Perfil del alumno: usa data/perfil.json si existe (local, no se sube al repo) y completa con el de ejemplo.
export function loadPerfil() {
  const { nota, ...example } = readJson("perfil.ejemplo.json");
  return existsSync(dataPath("perfil.json")) ? { ...example, ...readJson("perfil.json") } : example;
}

// Reemplaza {{clave}} por el valor del perfil.
export const fill = (text, perfil) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in perfil)) throw new Error(`Falta "${key}" en el perfil`);
    return perfil[key];
  });

// Aplica fill a todos los textos de una estructura de datos.
export function deepFill(value, perfil) {
  if (typeof value === "string") return fill(value, perfil);
  if (Array.isArray(value)) return value.map((v) => deepFill(v, perfil));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepFill(v, perfil)]));
  }
  return value;
}

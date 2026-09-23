import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Progreso del alumno en un JSON local (no va al repo, ver .gitignore).
// ALUMNO_FILE permite usar otro archivo (lo usan las pruebas para no pisar el progreso real).
const file = process.env.ALUMNO_FILE ?? fileURLToPath(new URL("../data/alumno.json", import.meta.url));

const empty = () => ({ items: {}, introduced: [] });

export function loadState() {
  return existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : empty();
}

export function saveState(state) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2));
}

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { newState } from "./game.js";

// Progreso del alumno en un JSON local (no va al repo, ver .gitignore).
// ALUMNO_FILE permite usar otro archivo (lo usan las pruebas para no pisar el progreso real).
const file = process.env.ALUMNO_FILE ?? fileURLToPath(new URL("../data/alumno.json", import.meta.url));

export function loadState() {
  if (!existsSync(file)) return newState();
  const saved = JSON.parse(readFileSync(file, "utf8"));
  return saved.version === 2 ? saved : newState(); // formato anterior: se empieza de cero
}

export function saveState(state) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(state, null, 2));
}

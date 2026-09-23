import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("../data/curriculum.json", import.meta.url));

export const loadCurriculum = () => JSON.parse(readFileSync(file, "utf8"));

const withLevel = (level) => level.phrases.map((p) => ({ ...p, levelId: level.id }));

export const phraseIndex = (curriculum) =>
  new Map(curriculum.levels.flatMap(withLevel).map((p) => [p.id, p]));

// Frases del mismo nivel y de los anteriores: sirven de distractores en los ejercicios.
export function poolFor(curriculum, phrase) {
  const pool = [];
  for (const level of curriculum.levels) {
    pool.push(...withLevel(level));
    if (level.id === phrase.levelId) break;
  }
  return pool;
}

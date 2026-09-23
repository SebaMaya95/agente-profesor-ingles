import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("../data/curriculum.json", import.meta.url));

export const loadCurriculum = () => JSON.parse(readFileSync(file, "utf8"));

// Cada palabra de una lección es un ítem de repaso: se pregunta en español, se responde en inglés.
export const itemsOf = (lesson) =>
  lesson.words.map((w) => ({
    id: `${lesson.id}:${w.en}`,
    lesson: lesson.id,
    prompt: `¿Cómo se dice "${w.es}" en inglés?`,
    answers: [w.en],
  }));

export const itemIndex = (curriculum) =>
  new Map(curriculum.lessons.flatMap(itemsOf).map((it) => [it.id, it]));

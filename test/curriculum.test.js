import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCurriculum, phraseIndex, poolFor } from "../src/curriculum.js";
import { normalize } from "../src/grading.js";

const curriculum = loadCurriculum();
const phrases = [...phraseIndex(curriculum).values()];

test("cada nivel tiene situación, nota de gramática, role-play y frases", () => {
  for (const level of curriculum.levels) {
    assert.ok(level.title && level.situation && level.grammarNote, level.id);
    assert.ok(level.roleplay.scenario && level.roleplay.goal, level.id);
    assert.ok(level.phrases.length >= 5, level.id);
  }
});

test("los ids de frases son únicos y empiezan con el id de su nivel", () => {
  const ids = curriculum.levels.flatMap((l) => l.phrases.map((p) => p.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const level of curriculum.levels) {
    for (const p of level.phrases) assert.ok(p.id.startsWith(`${level.id}.`), p.id);
  }
});

test("cada frase tiene palabra clave presente en el texto y un error típico distinto", () => {
  for (const p of phrases) {
    const words = p.en.split(" ").map(normalize);
    assert.ok(words.includes(normalize(p.key)), `${p.id}: la clave no está en la frase`);
    assert.equal(normalize(p.key).includes(" "), false, `${p.id}: la clave debe ser una palabra`);
    assert.notEqual(normalize(p.wrong), normalize(p.en), `${p.id}: 'wrong' igual a 'en'`);
    assert.ok(p.es && p.wrong, p.id);
  }
});

test("poolFor incluye el nivel de la frase y los anteriores, no los siguientes", () => {
  const cafe = phrases.find((p) => p.levelId === "cafe");
  const ids = new Set(poolFor(curriculum, cafe).map((p) => p.levelId));
  assert.deepEqual([...ids], ["presentarte", "cafe"]);
});

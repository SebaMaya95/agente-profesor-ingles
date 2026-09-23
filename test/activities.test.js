import { test } from "node:test";
import assert from "node:assert/strict";
import { TYPES, checkActivity, correctAnswer, makeActivity, pickType, typesFor } from "../src/activities.js";
import { loadCurriculum, phraseIndex, poolFor } from "../src/curriculum.js";
import { mulberry32 } from "../src/rng.js";

const curriculum = loadCurriculum();
const phrases = [...phraseIndex(curriculum).values()];

// Respuesta correcta (y una incorrecta) para cualquier tipo de actividad.
const right = (a) => (a.options ? a.correctIndex : a.type === "order" ? a.answer : a.target.en);
const wrong = (a) => (a.options ? (a.correctIndex + 1) % a.options.length : a.type === "order" ? a.words.join(" ") : a.target.wrong);

test("todo tipo de actividad se genera y se corrige bien para todas las frases", () => {
  const rng = mulberry32(7);
  for (const phrase of phrases) {
    for (const type of Object.keys(TYPES)) {
      const a = makeActivity(type, phrase, poolFor(curriculum, phrase), rng);
      assert.ok(a.prompt && a.skill && a.xp > 0, `${phrase.id}/${type}`);
      assert.equal(checkActivity(a, right(a)), true, `${phrase.id}/${type}: la respuesta correcta debe pasar`);
      assert.equal(checkActivity(a, wrong(a)), false, `${phrase.id}/${type}: la incorrecta no debe pasar`);
    }
  }
});

test("las actividades de opciones tienen opciones únicas y la correcta incluida", () => {
  const rng = mulberry32(3);
  for (const phrase of phrases) {
    for (const type of ["listen-choose", "spot-error", "cloze"]) {
      const a = makeActivity(type, phrase, poolFor(curriculum, phrase), rng);
      assert.equal(new Set(a.options).size, a.options.length, `${phrase.id}/${type}: opciones repetidas`);
      assert.ok(a.options.length >= 2);
      assert.equal(a.options[a.correctIndex], correctAnswer(a));
    }
  }
});

test("cloze deja un hueco y order mezcla las palabras", () => {
  const rng = mulberry32(11);
  for (const phrase of phrases) {
    const pool = poolFor(curriculum, phrase);
    assert.match(makeActivity("cloze", phrase, pool, rng).text, /___/);
    const order = makeActivity("order", phrase, pool, rng);
    assert.notEqual(order.words.join(" "), phrase.en);
    assert.deepEqual([...order.words].sort(), phrase.en.split(" ").sort());
  }
});

test("con la misma semilla se generan las mismas actividades", () => {
  const make = (seed) => makeActivity("listen-choose", phrases[5], poolFor(curriculum, phrases[5]), mulberry32(seed));
  assert.deepEqual(make(42), make(42));
});

test("la escalera pasa de reconocer a producir y no repite tipo seguido", () => {
  assert.ok(typesFor(0).includes("listen-choose") && !typesFor(0).includes("say-it"));
  assert.ok(typesFor(3).includes("say-it"));
  const rng = mulberry32(1);
  for (let i = 0; i < 50; i++) assert.notEqual(pickType(typesFor(2), "say-it", rng), "say-it");
});

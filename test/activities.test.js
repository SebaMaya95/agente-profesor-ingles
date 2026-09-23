import { test } from "node:test";
import assert from "node:assert/strict";
import {
  EXTRA_TYPES,
  ITEM_TYPES,
  TYPES,
  checkActivity,
  correctAnswer,
  extraCount,
  findKey,
  guidedMatches,
  makeExtraActivity,
  makeItemActivity,
  makeSentenceMatch,
  nextItemActivity,
  storyStep,
} from "../src/activities.js";
import { buildCurriculum } from "../src/curriculum.js";
import { mulberry32 } from "../src/rng.js";
import { rightResponse, wrongResponse } from "./helpers.js";

const curriculum = buildCurriculum();
const items = [...curriculum.items.values()];
const poolOf = (item) => curriculum.unitOf(item.unitId).itemList;

test("hay 12 tipos de ejercicio: 6 de ítem, 5 de unidad y el role-play con IA", () => {
  assert.equal(Object.keys(TYPES).length, 12);
  assert.equal(ITEM_TYPES.length, 6);
  assert.equal(EXTRA_TYPES.length, 5);
  for (const t of Object.values(TYPES)) assert.ok(t.skill && t.xp > 0);
});

test("los ejercicios de ítem se generan y corrigen bien para los 273 ítems", () => {
  const rng = mulberry32(7);
  const made = Object.fromEntries(ITEM_TYPES.map((t) => [t, 0]));
  for (const item of items) {
    for (const type of ITEM_TYPES) {
      const a = makeItemActivity(type, item, poolOf(item), rng);
      if (!a) continue;
      made[type] += 1;
      assert.ok(a.prompt && a.skill && a.xp > 0, `${item.id}/${type}`);
      assert.equal(checkActivity(a, rightResponse(a)), true, `${item.id}/${type}: la correcta debe pasar`);
      assert.equal(checkActivity(a, wrongResponse(a)), false, `${item.id}/${type}: la incorrecta no debe pasar`);
      if (a.options) {
        assert.equal(new Set(a.options).size, a.options.length, `${item.id}/${type}: opciones repetidas`);
        assert.equal(a.options[a.correctIndex], correctAnswer(a));
      }
    }
  }
  // Cada tipo debe poder generarse para una buena parte del vocabulario.
  for (const [type, n] of Object.entries(made)) assert.ok(n >= 60, `${type}: solo ${n} ítems lo soportan`);
});

test("cloze deja un hueco, order mezcla y match pide 3 o 4 pares únicos", () => {
  const rng = mulberry32(11);
  for (const item of items) {
    const cloze = makeItemActivity("cloze", item, poolOf(item), rng);
    if (cloze) assert.match(cloze.text, /___/);
    const order = makeItemActivity("order", item, poolOf(item), rng);
    if (order) assert.deepEqual([...order.words].sort(), order.answer.split(/\s+/).sort());
    const match = makeItemActivity("match", item, poolOf(item), rng);
    if (match) {
      assert.ok(match.pairs.length >= 3 && match.pairs.length <= 4);
      assert.equal(new Set(match.rights).size, match.rights.length);
    }
  }
});

test("findKey encuentra plurales, frases de varias palabras y devuelve null si no está", () => {
  const dog = { variants: ["Dog", "Puppy"] };
  assert.equal(findKey(dog, "I have two dogs.").text, "dogs");
  const nextTo = { variants: ["Next to"] };
  assert.deepEqual(findKey(nextTo, "The pharmacy is next to the bakery."), { start: 3, length: 2, text: "next to" });
  assert.equal(findKey(dog, "I like cats."), null);
});

test("con la misma semilla se generan las mismas actividades", () => {
  const make = (seed) => makeItemActivity("listen-choose", items[5], poolOf(items[5]), mulberry32(seed));
  assert.deepEqual(make(42), make(42));
});

test("la rotación de tipos no repite el mismo tipo seguido", () => {
  const rng = mulberry32(3);
  const unit = curriculum.units[0];
  for (const step of [0, 2]) {
    let cursor = { pos: 0, previous: null };
    let previous = null;
    for (const item of unit.itemList) {
      const result = nextItemActivity(item, step, unit.itemList, cursor, rng);
      cursor = result.cursor;
      assert.ok(result.activity, item.id);
      if (previous) assert.notEqual(result.activity.type, previous);
      previous = result.activity.type;
    }
  }
});

test("los ejercicios de unidad (errores, diálogos, transformaciones, historia, guiada) funcionan en sus dos escalones", () => {
  const rng = mulberry32(5);
  for (const unit of curriculum.units) {
    for (const type of EXTRA_TYPES) {
      assert.ok(extraCount(unit, type) > 0, `${unit.id}/${type}: falta material`);
      for (let entry = 0; entry < extraCount(unit, type); entry++) {
        for (const step of [0, 1]) {
          const a = makeExtraActivity(type, unit, entry, step, rng);
          const label = `${unit.id}/${type}/${entry}/${step}`;
          assert.equal(checkActivity(a, rightResponse(a)), true, `${label}: la correcta debe pasar`);
          assert.equal(checkActivity(a, wrongResponse(a)), false, `${label}: la incorrecta no debe pasar`);
        }
      }
    }
  }
});

test("el segundo escalón pide producir: corregir el error y decir la respuesta del diálogo", () => {
  const unit = curriculum.units[0];
  assert.equal(makeExtraActivity("spot-error", unit, 0, 0).mode, "choose");
  assert.equal(makeExtraActivity("spot-error", unit, 0, 1).mode, "fix");
  assert.equal(makeExtraActivity("dialogue", unit, 0, 0).mode, "choose");
  assert.equal(makeExtraActivity("dialogue", unit, 0, 1).mode, "say");
});

test("transformar acepta la forma con contracción o sin ella", () => {
  const unit = curriculum.units[0];
  const rng = mulberry32(2);
  for (let i = 0; i < 20; i++) {
    const a = makeExtraActivity("transform", unit, i % unit.extras.transforms.length, 0, rng);
    assert.notEqual(a.source, a.answer);
    assert.ok(checkActivity(a, a.answer.replace("n't", " not")));
  }
});

test("la consigna guiada exige cumplir el mínimo de requisitos y dice cuáles faltan", () => {
  for (const unit of curriculum.units) {
    const a = makeExtraActivity("guided", unit, 0, 0);
    assert.ok(guidedMatches(a, a.sample).length >= a.min, unit.id);
    assert.equal(checkActivity(a, "zzz"), false);
    assert.equal(guidedMatches(a, "zzz").length, 0);
  }
});

test("relacionar oraciones y conectores: los dos sets de la unidad de conectores se generan y corrigen", () => {
  const unit = curriculum.unitOf("conectores");
  const rng = mulberry32(9);
  assert.equal(unit.extras.matchSets.length, 2);
  for (let set = 0; set < 2; set++) {
    const a = makeSentenceMatch(unit, set, rng);
    assert.equal(a.pairs.length, 4);
    assert.equal(new Set(a.rights).size, 4);
    assert.equal(checkActivity(a, rightResponse(a)), true);
    assert.equal(checkActivity(a, wrongResponse(a)), false);
    assert.match(correctAnswer(a), /=/);
  }
});

test("las historias son grafos válidos: todo 'next' existe y llegan a un final", () => {
  for (const unit of curriculum.units) {
    const { story } = unit.extras;
    assert.ok(story.nodes[story.start], unit.id);
    let node = story.start;
    let steps = 0;
    while (!story.nodes[node].end) {
      const n = story.nodes[node];
      assert.ok(n.options.some((o) => o.good), `${unit.id}/${node}: sin opción buena`);
      for (const o of n.options) assert.ok(story.nodes[o.next], `${unit.id}/${node}: next inexistente`);
      const step = storyStep(story, node, n.options.findIndex((o) => o.good));
      assert.equal(step.good, true);
      node = step.next;
      assert.ok(++steps < 20, `${unit.id}: la historia no termina`);
    }
  }
});

test("la historia se aprueba con al menos 2 de 3 respuestas buenas", () => {
  const a = makeExtraActivity("story", curriculum.units[0], 0, 0);
  assert.equal(checkActivity(a, [true, true, false]), true);
  assert.equal(checkActivity(a, [true, false, false]), false);
  assert.equal(checkActivity(a, []), false);
});

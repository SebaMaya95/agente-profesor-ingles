import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCurriculum, loadPerfil, loadUnidades } from "../src/contenido-node.js";

const curriculum = loadCurriculum();

test("hay 12 unidades en el orden definido, con tiempos, role-play y material de ejercicios", () => {
  assert.deepEqual(curriculum.units.map((u) => u.id), loadUnidades().units.map((u) => u.id));
  assert.equal(curriculum.units.length, 12);
  for (const unit of curriculum.units) {
    assert.ok(unit.title && unit.situation && unit.roleplay.scenario && unit.roleplay.goal, unit.id);
    assert.ok(unit.tenses.length >= 1 && unit.tenses.every(Boolean), unit.id);
    assert.ok(unit.guided.prompt && unit.extras.errors.length >= 3, unit.id);
    assert.ok(unit.lessons.length >= 3, `${unit.id}: pocas lecciones para rotar los ejercicios`);
  }
});

test("todos los ítems quedan en exactamente una lección de hasta 6 ítems", () => {
  const seen = new Set();
  for (const lesson of curriculum.lessons) {
    assert.ok(lesson.itemIds.length >= 1 && lesson.itemIds.length <= 6, lesson.id);
    for (const id of lesson.itemIds) {
      assert.equal(seen.has(id), false, `${id} repetido`);
      seen.add(id);
      assert.equal(curriculum.items.get(id).lessonId, lesson.id);
    }
  }
  assert.equal(seen.size, curriculum.items.size);
  assert.ok(curriculum.items.size >= 270);
});

test("los ids de lección son únicos y cada unidad conoce sus ítems en orden", () => {
  const ids = curriculum.lessons.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const unit of curriculum.units) {
    assert.deepEqual(unit.itemList.map((i) => i.id), unit.lessons.flatMap((l) => l.itemIds));
  }
});

test("no queda ningún marcador sin completar y el perfil personaliza el contenido", () => {
  assert.equal(JSON.stringify([...curriculum.items.values()]).includes("{{"), false);
  assert.equal(JSON.stringify(curriculum.units.map((u) => u.extras)).includes("{{"), false);
  const custom = loadCurriculum({ ...loadPerfil(), name: "Zedrik" });
  assert.ok(JSON.stringify([...custom.items.values()]).includes("Zedrik"));
});

test("las variantes separan las alternativas de una palabra (Father / Dad)", () => {
  const father = [...curriculum.items.values()].find((i) => i.en === "Father / Dad");
  assert.deepEqual(father.variants, ["Father", "Dad"]);
});

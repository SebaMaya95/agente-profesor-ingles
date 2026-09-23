import { test } from "node:test";
import assert from "node:assert/strict";
import { itemIndex, itemsOf, loadCurriculum } from "../src/curriculum.js";

test("los ids de ítems son únicos y cada lección tiene palabras y patrón", () => {
  const c = loadCurriculum();
  const ids = c.lessons.flatMap(itemsOf).map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(itemIndex(c).size, ids.length);
  for (const l of c.lessons) {
    assert.ok(l.words.length > 0 && l.pattern);
  }
});

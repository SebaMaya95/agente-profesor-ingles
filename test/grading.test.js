import { test } from "node:test";
import assert from "node:assert/strict";
import { isCorrect, normalize } from "../src/grading.js";

test("ignora mayúsculas, espacios y puntuación", () => {
  assert.ok(isCorrect("  Thank   You! ", ["thank you"]));
});

test("ignora acentos", () => {
  assert.equal(normalize("Café"), "cafe");
});

test("rechaza respuestas distintas", () => {
  assert.equal(isCorrect("hi", ["hello"]), false);
});

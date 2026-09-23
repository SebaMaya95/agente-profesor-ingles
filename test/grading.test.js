import { test } from "node:test";
import assert from "node:assert/strict";
import { gradePhrase, normalize, similarity } from "../src/grading.js";

const sam = { en: "Hi, my name is Sam.", key: "name", wrong: "Hi, me name is Sam." };
const lives = { en: "She lives in Rosario.", key: "lives", wrong: "She live in Rosario." };

test("normalize ignora mayúsculas, acentos, apóstrofes y puntuación", () => {
  assert.equal(normalize("  Café!  "), "cafe");
  assert.equal(normalize("I'm  fine, thanks."), "im fine thanks");
});

test("similarity es 1 para textos iguales y baja con las diferencias", () => {
  assert.equal(similarity("nice to meet you", "Nice to meet you."), 1);
  assert.ok(similarity("nice to meet you", "hello world") < 0.5);
});

test("gradePhrase acepta la frase correcta y errores mínimos de reconocimiento", () => {
  assert.ok(gradePhrase("hi my name is sam", sam));
  assert.ok(gradePhrase("Hi, my name is Sam", sam));
  assert.ok(gradePhrase("hi my name iz sam", sam)); // typo o error de voz
});

test("gradePhrase rechaza el error típico aunque se parezca mucho", () => {
  assert.equal(gradePhrase("Hi, me name is Sam", sam), false);
  assert.equal(gradePhrase("She live in Rosario", lives), false);
});

test("gradePhrase exige la palabra clave y rechaza lo que no se parece", () => {
  assert.equal(gradePhrase("Hi, my is Sam", sam), false);
  assert.equal(gradePhrase("I like pizza", sam), false);
  assert.equal(gradePhrase("", sam), false);
});

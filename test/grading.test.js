import { test } from "node:test";
import assert from "node:assert/strict";
import { gradeAnyOf, gradePhrase, normalize, sameSentence, similarity } from "../src/grading.js";

const sam = { en: "Hi, my name is Sam.", key: "name", wrong: "Hi, me name is Sam." };
const lives = { en: "She lives in Rosario.", key: "lives", wrong: "She live in Rosario." };

test("normalize ignora mayúsculas, acentos y puntuación, y expande contracciones", () => {
  assert.equal(normalize("  Café!  "), "cafe");
  assert.equal(normalize("I'm  fine, thanks."), "i am fine thanks");
  assert.equal(normalize("She doesn't work"), "she does not work");
  assert.equal(normalize("I won't go"), "i will not go");
  assert.equal(normalize("They’re here"), "they are here"); // apóstrofe tipográfico
});

test("sameSentence trata contracciones y formas completas como iguales", () => {
  assert.ok(sameSentence("She doesn't live in Rosario.", "she does not live in rosario"));
  assert.ok(sameSentence("He isn't playing soccer.", "He is not playing soccer"));
  assert.equal(sameSentence("She live in Rosario", "She lives in Rosario"), false);
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

test("gradePhrase exige la palabra clave si la hay, y funciona sin clave ni error típico", () => {
  assert.equal(gradePhrase("Hi, my is Sam", sam), false);
  assert.equal(gradePhrase("I like pizza", sam), false);
  assert.equal(gradePhrase("", sam), false);
  assert.ok(gradePhrase("nice to meet you", { en: "Nice to meet you." }));
});

test("la clave con contracción se compara ya expandida", () => {
  const phrase = { en: "I don't like coffee.", key: "don't", wrong: "I no like coffee." };
  assert.ok(gradePhrase("I do not like coffee", phrase));
});

test("gradeAnyOf: palabras sueltas exactas, frases con tolerancia, y variantes", () => {
  assert.ok(gradeAnyOf("Dog", ["Dog", "Puppy"]));
  assert.ok(gradeAnyOf("puppy", ["Dog", "Puppy"]));
  assert.equal(gradeAnyOf("doog", ["Dog"]), false);
  assert.ok(gradeAnyOf("how much does it cost", ["How much does it cost?"]));
  assert.equal(gradeAnyOf("", ["Dog"]), false);
});

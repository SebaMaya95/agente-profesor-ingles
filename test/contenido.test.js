import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fill, loadPerfil, loadTiempos, loadVocabulario } from "../src/contenido.js";

const vocab = loadVocabulario();
const items = vocab.categories.flatMap((c) => c.groups.flatMap((g) => g.items));
const rel = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

test("hay 12 categorías y cada una tiene grupos con ítems válidos", () => {
  assert.equal(vocab.categories.length, 12);
  for (const c of vocab.categories) {
    assert.ok(c.title && c.titleEs && c.groups.length > 0, c.id);
    for (const g of c.groups) assert.ok(g.title && g.items.length > 0, `${c.id}/${g.title}`);
  }
  assert.ok(items.length >= 270);
});

test("los ids de ítems son únicos y cada ítem tiene inglés y al menos un ejemplo", () => {
  const ids = items.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const i of items) {
    assert.ok(i.en, i.id);
    assert.ok(Array.isArray(i.examples) && i.examples.length > 0 && i.examples.every(Boolean), i.id);
  }
});

test("hay 5 tiempos verbales con usos, claves y estructuras afirmativa, negativa e interrogativa", () => {
  const { tenses } = loadTiempos();
  assert.deepEqual(
    tenses.map((t) => t.id),
    ["presente-simple", "presente-continuo", "pasado-simple", "futuro-will", "futuro-going-to"],
  );
  for (const t of tenses) {
    assert.ok(t.uses.length >= 2 && t.keys.length >= 2, t.id);
    for (const form of ["affirmative", "negative", "interrogative"]) {
      assert.ok(t.structures[form].length >= 1, `${t.id}/${form}`);
      for (const s of t.structures[form]) assert.ok(s.pattern && s.example);
    }
  }
});

test("todos los marcadores {{clave}} existen en el perfil de ejemplo y fill los reemplaza", () => {
  const perfil = loadPerfil();
  const texts = items.flatMap((i) => [i.en, i.es ?? "", ...i.examples]);
  const placeholders = texts.flatMap((t) => [...t.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]));
  assert.ok(placeholders.length >= 15);
  for (const key of new Set(placeholders)) assert.ok(key in perfil, `falta ${key}`);
  for (const t of texts) assert.equal(fill(t, perfil).includes("{{"), false);
  assert.throws(() => fill("Hola {{inexistente}}", perfil), /inexistente/);
});

// Guarda de privacidad: si existe el perfil real (local), ningún dato personal puede estar en los archivos versionados.
test("los datos personales del perfil local no aparecen en el contenido versionado", { skip: !existsSync(rel("data/perfil.json")) }, () => {
  const real = JSON.parse(readFileSync(rel("data/perfil.json"), "utf8"));
  const sensibles = ["name", "hometown", "birthday", "height", "weight", "father", "mother", "brother", "sister", "grandmother", "godson", "goddaughter", "pet1", "pet2"];
  const committed = ["data/contenido/vocabulario.json", "data/contenido/tiempos.json", "data/curriculum.json", "data/perfil.ejemplo.json"]
    .map((p) => readFileSync(rel(p), "utf8"))
    .join("\n");
  for (const key of sensibles) {
    const value = real[key];
    if (!value) continue;
    const word = new RegExp(`(?<![\\p{L}\\p{N}])${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u");
    assert.equal(word.test(committed), false, `el dato "${key}" del perfil local aparece en un archivo versionado`);
  }
});

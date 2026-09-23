import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { fill } from "../src/contenido.js";
import { loadActividades, loadPerfil, loadTiempos, loadUnidades, loadVocabulario } from "../src/contenido-node.js";

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

test("cada unidad usa tiempos que existen y cubre las categorías del vocabulario en el mismo orden", () => {
  const { units } = loadUnidades();
  const tenseIds = new Set(loadTiempos().tenses.map((t) => t.id));
  assert.deepEqual(units.map((u) => u.id), vocab.categories.map((c) => c.id));
  for (const u of units) {
    assert.ok(u.tenses.length >= 1 && u.tenses.every((t) => tenseIds.has(t)), u.id);
    assert.ok(u.situation && u.roleplay.scenario && u.roleplay.goal, u.id);
    assert.ok(u.guided.requirements.length >= 3 && u.guided.min >= 1 && u.guided.sample, u.id);
    for (const r of u.guided.requirements) assert.doesNotThrow(() => new RegExp(r.re, "i"), `${u.id}: regex inválida`);
  }
});

test("el material de ejercicios de cada unidad es consistente", () => {
  const actividades = loadActividades();
  for (const { id } of loadUnidades().units) {
    const a = actividades[id];
    assert.ok(a, `falta material para ${id}`);
    assert.ok(a.errors.length >= 3, `${id}: pocos errores típicos`);
    for (const e of a.errors) assert.notEqual(e.correct, e.wrong, id);
    assert.ok(a.transforms.length >= 2, id);
    for (const t of a.transforms) {
      assert.ok(t.forms.affirmative && t.forms.negative && t.forms.interrogative, id);
      assert.equal(new Set(Object.values(t.forms)).size, 3, `${id}: las 3 formas deben ser distintas`);
    }
    assert.ok(a.dialogues.length >= 2, id);
    for (const d of a.dialogues) {
      assert.ok(d.gap > 0 && d.gap < d.turns.length - 1 + 1 && d.turns[d.gap].text, `${id}: gap inválido`);
      assert.ok(d.distractors.length >= 2 && !d.distractors.includes(d.turns[d.gap].text), id);
    }
    assert.ok(a.story?.nodes[a.story.start], id);
  }
  assert.equal(actividades.conectores.matchSets.length, 2);
});

// Guarda de privacidad: si existe el perfil real (local), ningún dato personal puede estar en los archivos versionados.
test("los datos personales del perfil local no aparecen en el contenido versionado", { skip: !existsSync(rel("data/perfil.json")) }, () => {
  const real = JSON.parse(readFileSync(rel("data/perfil.json"), "utf8"));
  const sensibles = ["name", "hometown", "birthday", "height", "weight", "father", "mother", "brother", "sister", "grandmother", "godson", "goddaughter", "pet1", "pet2"];
  const committed = [
    "data/contenido/vocabulario.json",
    "data/contenido/tiempos.json",
    "data/contenido/unidades.json",
    "data/contenido/actividades.json",
    "data/perfil.ejemplo.json",
  ]
    .map((p) => readFileSync(rel(p), "utf8"))
    .join("\n");
  for (const key of sensibles) {
    const value = real[key];
    if (!value) continue;
    const word = new RegExp(`(?<![\\p{L}\\p{N}])${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "u");
    assert.equal(word.test(committed), false, `el dato "${key}" del perfil local aparece en un archivo versionado`);
  }
});

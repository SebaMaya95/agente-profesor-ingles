import { test } from "node:test";
import assert from "node:assert/strict";
import { EXTRA_TYPES, ITEM_TYPES, TYPES, checkActivity } from "../src/activities.js";
import { loadCurriculum } from "../src/contenido-node.js";
import {
  EXTRAS_PER_LESSON,
  completeRoleplay,
  currentLesson,
  distractorPool,
  extraActivities,
  isLessonCleared,
  isUnitCleared,
  lessonActivities,
  lessonCrowns,
  newState,
  nextReviews,
  record,
  roleplayAvailable,
  unlockedLessons,
} from "../src/game.js";
import { mulberry32 } from "../src/rng.js";
import { rightResponse } from "./helpers.js";

const curriculum = loadCurriculum();
const [unit1, unit2] = curriculum.units;

// Alumno bot: responde todo (bien o mal) y devuelve el estado nuevo.
function answerAll(state, activities, context, day, ok = true) {
  let s = state;
  for (const a of activities) s = record(s, a, ok && checkActivity(a, rightResponse(a)), context, day);
  return s;
}

// Juega una lección completa como un alumno perfecto; devuelve el estado y todo lo que se practicó.
function playLesson(state, lesson, rng, day, log = []) {
  let s = state;
  for (let round = 0; round < 4 && !isLessonCleared(s, lesson); round++) {
    const activities = lessonActivities(s, curriculum, lesson, rng, { extras: round === 0 });
    log.push(...activities);
    s = answerAll(s, activities, "learn", day);
  }
  return s;
}

test("un alumno nuevo empieza en la primera lección y solo esa está desbloqueada", () => {
  const s = newState();
  assert.equal(currentLesson(s, curriculum).id, curriculum.lessons[0].id);
  assert.deepEqual(unlockedLessons(s, curriculum).map((l) => l.id), [curriculum.lessons[0].id]);
});

test("superar una lección da XP, abre la siguiente y arma la racha", () => {
  const rng = mulberry32(5);
  const s = playLesson(newState(), curriculum.lessons[0], rng, 1000);
  assert.ok(isLessonCleared(s, curriculum.lessons[0]));
  assert.equal(currentLesson(s, curriculum).id, curriculum.lessons[1].id);
  assert.equal(unlockedLessons(s, curriculum).length, 2);
  assert.ok(s.xp > 0);
  assert.equal(s.streak.days, 1);
});

test("un error al aprender no suma aciertos ni XP", () => {
  const rng = mulberry32(5);
  const s0 = newState();
  const [activity] = lessonActivities(s0, curriculum, curriculum.lessons[0], rng, { extras: false });
  const s1 = record(s0, activity, false, "learn", 1000);
  assert.equal(s1.items[activity.itemId].passes, 0);
  assert.equal(s1.xp, 0);
});

test("los repasos aparecen al día siguiente y las coronas suben con repasos espaciados", () => {
  const rng = mulberry32(9);
  const lesson = curriculum.lessons[0];
  let s = playLesson(newState(), lesson, rng, 1000);
  assert.equal(nextReviews(s, curriculum, 1000, rng, 10).length, 0); // nada vencido el mismo día
  assert.equal(lessonCrowns(s, lesson), 0);

  const reviews = nextReviews(s, curriculum, 1001, rng, 10);
  assert.equal(reviews.length, lesson.itemIds.length);
  s = answerAll(s, reviews, "review", 1001);
  assert.equal(lessonCrowns(s, lesson), 1);
  assert.equal(s.streak.days, 2);
});

test("fallar un repaso vuelve el ítem al primer intervalo y no da corona", () => {
  const rng = mulberry32(2);
  const lesson = curriculum.lessons[0];
  let s = playLesson(newState(), lesson, rng, 1000);
  s = answerAll(s, nextReviews(s, curriculum, 1001, rng, 10), "review", 1001, false);
  assert.equal(lessonCrowns(s, lesson), 0);
  for (const id of lesson.itemIds) assert.equal(s.items[id].due, 1002);
});

test("los repasos mezclan unidades y no repiten el tipo de ejercicio seguido", () => {
  const rng = mulberry32(8);
  let s = newState();
  for (const lesson of [unit1.lessons[0], ...unit1.lessons.slice(1), unit2.lessons[0]]) s = playLesson(s, lesson, rng, 1000);
  const reviews = nextReviews(s, curriculum, 1001, rng, 8);
  assert.equal(new Set(reviews.slice(0, 2).map((a) => a.unitId)).size, 2); // intercalado entre unidades
  for (let i = 1; i < reviews.length; i++) assert.notEqual(reviews[i].type, reviews[i - 1].type);
});

test("el role-play se habilita al superar toda la unidad, da XP una sola vez y pide turnos mínimos", () => {
  const rng = mulberry32(4);
  let s = newState();
  for (const lesson of unit1.lessons) {
    assert.equal(roleplayAvailable(s, unit1), false);
    s = playLesson(s, lesson, rng, 1000);
  }
  assert.ok(isUnitCleared(s, unit1));
  assert.ok(roleplayAvailable(s, unit1));
  const before = s.xp;
  assert.equal(completeRoleplay(s, unit1.id, 1, 1000).xp, before);
  s = completeRoleplay(s, unit1.id, 3, 1000);
  assert.equal(s.xp, before + TYPES.roleplay.xp);
  assert.equal(roleplayAvailable(s, unit1), false);
  assert.equal(completeRoleplay(s, unit1.id, 3, 1000).xp, s.xp);
});

// --- Rotación de los tipos de ejercicio con las categorías ---------------------------------------

test("en CADA unidad rotan los 11 tipos de ejercicio (6 de ítem y 5 de unidad)", () => {
  for (const unit of curriculum.units) {
    const rng = mulberry32(100 + unit.index);
    const seen = new Set();
    let s = newState(); // un alumno perfecto que juega solo esta unidad
    for (const lesson of unit.lessons) {
      const log = [];
      s = playLesson(s, lesson, rng, 1000, log);
      for (const a of log) seen.add(a.type);
    }
    for (const type of [...ITEM_TYPES, ...EXTRA_TYPES]) assert.ok(seen.has(type), `${unit.id}: nunca apareció "${type}"`);
  }
});

test("los ejercicios de unidad rotan entre lecciones y la unidad define dónde arranca", () => {
  const rng = mulberry32(1);
  for (const unit of [unit1, unit2]) {
    let s = newState();
    const order = [];
    for (const lesson of unit.lessons) {
      const extras = lessonActivities(s, curriculum, lesson, rng, { extras: true }).filter((a) => a.extraId);
      assert.equal(extras.length, EXTRAS_PER_LESSON);
      order.push(...extras.map((a) => a.type));
      s = playLesson(s, lesson, rng, 1000);
    }
    const expected = Array.from({ length: order.length }, (_, k) => EXTRA_TYPES[(unit.index + k) % EXTRA_TYPES.length]);
    assert.deepEqual(order, expected, unit.id);
  }
  // Empiezan en tipos distintos.
  const firstOf = (unit) => lessonActivities(newState(), curriculum, unit.lessons[0], rng, { extras: true }).find((a) => a.extraId).type;
  assert.notEqual(firstOf(unit1), firstOf(unit2));
});

test("cada lección de la unidad de conectores suma el emparejado de oraciones, alternando los dos sets", () => {
  const unit = curriculum.unitOf("conectores");
  const rng = mulberry32(3);
  let s = newState();
  const sets = [];
  for (const lesson of unit.lessons.slice(0, 4)) {
    const halves = lessonActivities(s, curriculum, lesson, rng, { extras: true }).filter((a) => a.variant === "halves");
    assert.equal(halves.length, 1, lesson.id);
    sets.push(halves[0].extraId);
    s = playLesson(s, lesson, rng, 1000);
  }
  assert.deepEqual(sets, ["conectores:match:0", "conectores:match:1", "conectores:match:0", "conectores:match:1"]);
  // Las demás unidades no lo tienen.
  const other = lessonActivities(newState(), curriculum, unit1.lessons[0], rng, { extras: true });
  assert.equal(other.some((a) => a.variant === "halves"), false);
});

test("un ejercicio de unidad usa primero material nuevo y, al agotarlo, sube al escalón que pide producir", () => {
  const rng = mulberry32(6);
  const modeOf = (state, type) => extraActivities(state, unit1, 5, rng).find((a) => a.type === type)?.mode;

  // Con material sin usar, se sirve el escalón 0 (elegir).
  assert.equal(modeOf(newState(), "spot-error"), "choose");

  // Con TODO el material de errores y de diálogos ya hecho una vez, se sirve el escalón 1 (corregir / decir).
  const done = newState();
  unit1.extras.errors.forEach((_, i) => (done.extras[`${unit1.id}:spot-error:${i}`] = 1));
  unit1.extras.dialogues.forEach((_, i) => (done.extras[`${unit1.id}:dialogue:${i}`] = 1));
  assert.equal(modeOf(done, "spot-error"), "fix");
  assert.equal(modeOf(done, "dialogue"), "say");
});

test("dentro de una tanda de práctica no se repite el mismo tipo de ejercicio de ítem seguido", () => {
  const rng = mulberry32(12);
  for (const lesson of curriculum.lessons) {
    const types = lessonActivities(newState(), curriculum, lesson, rng, { extras: false }).map((a) => a.type);
    for (let i = 1; i < types.length; i++) assert.notEqual(types[i], types[i - 1], `${lesson.id}: ${types.join(",")}`);
  }
});

test("las opciones falsas salen solo de lo que el alumno ya vio (o de un mínimo de 8 ítems)", () => {
  const rng = mulberry32(31);
  for (const lesson of curriculum.lessons) {
    const unit = curriculum.unitOf(lesson.unitId);
    const allowed = new Set(distractorPool(unit, lesson.id).map((i) => i.es));
    assert.ok(distractorPool(unit, lesson.id).length >= Math.min(8, unit.itemList.length), lesson.id);
    for (const a of lessonActivities(newState(), curriculum, lesson, rng, { extras: false })) {
      for (const meaning of [...(a.type === "listen-choose" ? a.options : []), ...(a.rights ?? [])]) {
        assert.ok(allowed.has(meaning), `${lesson.id}/${a.type}: "${meaning}" es de una lección que aún no vio`);
      }
    }
  }
});

test("distintas unidades arrancan la rotación en tipos distintos", () => {
  const rng = mulberry32(21);
  const starts = new Set(curriculum.lessons.map((l) => lessonActivities(newState(), curriculum, l, rng, { extras: false })[0]?.type));
  assert.ok(starts.size >= 3, [...starts].join(","));
});

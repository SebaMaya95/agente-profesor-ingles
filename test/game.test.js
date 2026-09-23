import { test } from "node:test";
import assert from "node:assert/strict";
import { checkActivity } from "../src/activities.js";
import { loadCurriculum } from "../src/curriculum.js";
import {
  ROLEPLAY_XP,
  completeRoleplay,
  crowns,
  currentLevel,
  isCleared,
  learnActivities,
  newState,
  nextReviews,
  record,
  roleplayAvailable,
  unlockedLevels,
} from "../src/game.js";
import { mulberry32 } from "../src/rng.js";

const curriculum = loadCurriculum();
const [level1, level2] = curriculum.levels;

const rightResponse = (a) => (a.options ? a.correctIndex : a.type === "order" ? a.answer : a.target.en);

// Alumno bot: responde todo bien y devuelve el estado nuevo.
function answerAll(state, activities, context, day, ok = true) {
  let s = state;
  for (const a of activities) {
    const correct = ok && checkActivity(a, rightResponse(a));
    s = record(s, a, correct, context, day);
  }
  return s;
}

test("un alumno nuevo empieza en el nivel 1 y solo ese está desbloqueado", () => {
  const s = newState();
  assert.equal(currentLevel(s, curriculum).id, level1.id);
  assert.deepEqual(unlockedLevels(s, curriculum).map((l) => l.id), [level1.id]);
});

test("aprender bien un nivel lo supera, da XP, abre el siguiente y arma la racha", () => {
  const rng = mulberry32(5);
  let s = newState();
  for (let round = 0; round < 3 && !isCleared(s, level1); round++) {
    s = answerAll(s, learnActivities(s, curriculum, level1, rng), "learn", 1000);
  }
  assert.ok(isCleared(s, level1));
  assert.equal(currentLevel(s, curriculum).id, level2.id);
  assert.equal(unlockedLevels(s, curriculum).length, 2);
  assert.ok(s.xp > 0);
  assert.equal(s.streak.days, 1);
});

test("un error al aprender no suma aciertos ni XP", () => {
  const rng = mulberry32(5);
  const s0 = newState();
  const [activity] = learnActivities(s0, curriculum, level1, rng);
  const s1 = record(s0, activity, false, "learn", 1000);
  assert.equal(s1.phrases[activity.phraseId].passes, 0);
  assert.equal(s1.xp, 0);
});

test("los repasos aparecen al día siguiente y las coronas suben con repasos espaciados", () => {
  const rng = mulberry32(9);
  let s = newState();
  for (let r = 0; r < 3 && !isCleared(s, level1); r++) {
    s = answerAll(s, learnActivities(s, curriculum, level1, rng), "learn", 1000);
  }
  // Todavía no hay nada vencido el mismo día.
  assert.equal(nextReviews(s, curriculum, 1000, rng, 10).length, 0);
  assert.equal(crowns(s, level1), 0);

  // Al día siguiente hay repasos; aprobarlos da la primera corona.
  const reviews = nextReviews(s, curriculum, 1001, rng, 10);
  assert.equal(reviews.length, level1.phrases.length);
  s = answerAll(s, reviews, "review", 1001);
  assert.equal(crowns(s, level1), 1);
  assert.equal(s.streak.days, 2);
});

test("fallar un repaso vuelve la frase al primer intervalo y no da corona", () => {
  const rng = mulberry32(2);
  let s = newState();
  for (let r = 0; r < 3 && !isCleared(s, level1); r++) {
    s = answerAll(s, learnActivities(s, curriculum, level1, rng), "learn", 1000);
  }
  s = answerAll(s, nextReviews(s, curriculum, 1001, rng, 10), "review", 1001, false);
  assert.equal(crowns(s, level1), 0);
  for (const p of level1.phrases) assert.equal(s.phrases[p.id].due, 1002);
});

test("el role-play da XP una sola vez y solo con suficientes turnos", () => {
  const rng = mulberry32(4);
  let s = newState();
  for (let r = 0; r < 3 && !isCleared(s, level1); r++) {
    s = answerAll(s, learnActivities(s, curriculum, level1, rng), "learn", 1000);
  }
  assert.ok(roleplayAvailable(s, level1));
  const before = s.xp;
  assert.equal(completeRoleplay(s, level1.id, 1, 1000).xp, before); // pocos turnos
  s = completeRoleplay(s, level1.id, 3, 1000);
  assert.equal(s.xp, before + ROLEPLAY_XP);
  assert.equal(roleplayAvailable(s, level1), false);
  assert.equal(completeRoleplay(s, level1.id, 3, 1000).xp, s.xp); // no se repite
});

test("los repasos mezclan niveles y no repiten el tipo de ejercicio seguido", () => {
  const rng = mulberry32(8);
  let s = newState();
  for (const level of [level1, level2]) {
    for (let r = 0; r < 3 && !isCleared(s, level); r++) {
      s = answerAll(s, learnActivities(s, curriculum, level, rng), "learn", 1000);
    }
  }
  const reviews = nextReviews(s, curriculum, 1001, rng, 6);
  assert.equal(new Set(reviews.slice(0, 2).map((a) => a.levelId)).size, 2); // intercalado
  for (let i = 1; i < reviews.length; i++) assert.notEqual(reviews[i].type, reviews[i - 1].type);
});

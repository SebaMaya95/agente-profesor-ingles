import { test } from "node:test";
import assert from "node:assert/strict";
import { loadCurriculum } from "../src/contenido-node.js";
import { isLessonCleared, newState, record } from "../src/game.js";
import { mulberry32 } from "../src/rng.js";
import { MAX_ROUNDS, Session } from "../web/session.js";
import { DEFAULT_SETTINGS, createStorage } from "../web/storage.js";
import { rightResponse, wrongResponse } from "./helpers.js";

const curriculum = loadCurriculum();
const lesson0 = curriculum.lessons[0];
const make = (state = newState(), extra = {}) => new Session({ state, curriculum, day: 1000, rng: mulberry32(5), ...extra });

// --- Session ------------------------------------------------------------------------------------------

test("una sesión nueva arma la cola de la primera lección con ejercicios de unidad", () => {
  const s = make();
  assert.equal(s.lesson.id, lesson0.id);
  assert.ok(s.queue.length > 5);
  assert.ok(s.queue.some((q) => q.activity.extraId));
  assert.ok(s.queue.every((q) => q.context === "learn")); // primer día: no hay repasos
  assert.equal(s.progress, 0);
  assert.equal(s.finished, false);
});

test("jugar bien la lección la supera, suma XP y termina con progreso 1", () => {
  const s = make();
  let last = 0;
  while (!s.finished) {
    s.submit(rightResponse(s.current));
    s.next();
    last = s.progress;
  }
  assert.equal(last, 1);
  const summary = s.summary();
  assert.equal(summary.cleared, true);
  assert.equal(summary.accuracy, 100);
  assert.ok(summary.xp > 0);
  assert.equal(summary.streak, 1);
  assert.ok(isLessonCleared(s.state, lesson0));
});

test("submit corrige, guarda el resultado y actualiza el estado sin tocar el original", () => {
  const original = newState();
  const s = make(original);
  const activity = s.current;
  const bad = s.submit(wrongResponse(activity));
  assert.equal(bad.ok, false);
  assert.equal(bad.xp, 0);
  assert.equal(s.correct, 0);
  assert.equal(original.xp, 0); // el estado de entrada no se modifica
  s.next();
  const good = s.submit(rightResponse(s.current));
  assert.equal(good.ok, true);
  assert.ok(s.state.xp > 0);
});

test("si se falla todo, se arman nuevas tandas hasta el máximo y la lección queda sin superar", () => {
  const s = make();
  let answered = 0;
  while (!s.finished) {
    s.submit(wrongResponse(s.current));
    s.next();
    answered += 1;
    assert.ok(answered < 500, "la sesión no termina");
  }
  assert.equal(s.rounds, MAX_ROUNDS);
  assert.equal(s.summary().cleared, false);
  assert.equal(s.summary().accuracy, 0);
});

test("los repasos vencidos van primero y usan el contexto de repaso", () => {
  const s0 = make();
  while (!s0.finished) {
    s0.submit(rightResponse(s0.current));
    s0.next();
  }
  const next = new Session({ state: s0.state, curriculum, day: 1001, rng: mulberry32(2) });
  assert.equal(next.queue[0].context, "review");
  assert.ok(next.queue.some((q) => q.context === "learn"));
});

test("sin lección pendiente ni repasos, la sesión termina de inmediato", () => {
  let state = newState();
  for (const l of curriculum.lessons) {
    for (const id of l.itemIds) {
      state = record(state, { itemId: id, unitId: l.unitId, xp: 1 }, true, "learn", 1000);
      state = record(state, { itemId: id, unitId: l.unitId, xp: 1 }, true, "learn", 1000);
    }
  }
  const s = new Session({ state, curriculum, day: 1000, rng: mulberry32(1) });
  assert.equal(s.finished, true);
  assert.equal(s.summary().lesson, null);
});

// --- Almacenamiento en el navegador --------------------------------------------------------------------

const fakeBackend = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: (k) => data.delete(k), data };
};

test("el progreso, el perfil y los ajustes se guardan y se recuperan", () => {
  const storage = createStorage(fakeBackend());
  const state = { ...newState(), xp: 77 };
  assert.ok(storage.saveState(state));
  assert.equal(storage.loadState().xp, 77);
  storage.saveProfile({ name: "Zed" });
  assert.deepEqual(storage.loadProfile({ name: "Sam", age: "30" }), { name: "Zed", age: "30" }); // completa con los valores por defecto
  storage.saveSettings({ voice: false });
  assert.deepEqual(storage.loadSettings(), { ...DEFAULT_SETTINGS, voice: false });
});

test("sin nada guardado, con datos corruptos o de otra versión, se empieza de cero sin romper", () => {
  const backend = fakeBackend();
  const storage = createStorage(backend);
  assert.equal(storage.loadState().xp, 0);
  backend.setItem("ingles.estado.v3", "{no es json");
  assert.equal(storage.loadState().xp, 0);
  backend.setItem("ingles.estado.v3", JSON.stringify({ version: 2, xp: 999 }));
  assert.equal(storage.loadState().xp, 0);
});

test("si el navegador bloquea el almacenamiento, la app sigue funcionando", () => {
  const blocked = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); }, removeItem: () => { throw new Error("bloqueado"); } };
  const storage = createStorage(blocked);
  assert.equal(storage.loadState().xp, 0);
  assert.equal(storage.saveState(newState()), false);
  assert.doesNotThrow(() => storage.resetState());
  assert.deepEqual(storage.loadSettings(), DEFAULT_SETTINGS);
});

test("borrar el progreso no toca el perfil ni los ajustes", () => {
  const storage = createStorage(fakeBackend());
  storage.saveState({ ...newState(), xp: 5 });
  storage.saveProfile({ name: "Zed" });
  storage.resetState();
  assert.equal(storage.loadState().xp, 0);
  assert.equal(storage.loadProfile({ name: "Sam" }).name, "Zed");
});

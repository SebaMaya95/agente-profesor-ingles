// Reglas del juego: progreso, XP, lecciones, coronas, repasos y rotación de ejercicios. Todo en código, sin tokens.
import {
  EXTRA_TYPES,
  ITEM_TYPES,
  TYPES,
  extraCount,
  makeExtraActivity,
  makeSentenceMatch,
  nextItemActivity,
} from "./activities.js";
import { dueItems, newItem, review } from "./scheduler.js";

export const PASSES_TO_CLEAR = 2; // aciertos por ítem para darlo por aprendido en la sesión
export const CLEAR_RATIO = 0.8; // proporción de ítems de la lección que hay que aprender
export const EXTRAS_PER_LESSON = 2; // ejercicios de unidad (errores, diálogos, historias...) por lección
export const ROLEPLAY_MIN_TURNS = 3;
export const MAX_CROWNS = 3;

export const newState = () => ({
  version: 3,
  xp: 0,
  streak: { days: 0, last: null },
  items: {},
  extras: {}, // veces que se hizo cada ejercicio de unidad
  roleplays: [],
});

const POOL_MIN = 8; // mínimo de ítems para armar opciones falsas

// Opciones falsas: solo ítems de la lección actual y de las anteriores de la unidad (lo que el alumno ya vio).
// Si son pocos (primeras lecciones), se completa con los siguientes para que siempre haya alternativas.
export function distractorPool(unit, lessonId) {
  const upTo = unit.lessons.findIndex((l) => l.id === lessonId) + 1;
  const seen = unit.lessons.slice(0, upTo).reduce((n, l) => n + l.itemIds.length, 0);
  return unit.itemList.slice(0, Math.max(seen, POOL_MIN)); // itemList sigue el orden de las lecciones
}

const passesOf = (state, itemId) => state.items[itemId]?.passes ?? 0;
const hash = (text) => [...text].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

export const isLessonCleared = (state, lesson) =>
  lesson.itemIds.filter((id) => passesOf(state, id) >= PASSES_TO_CLEAR).length >=
  Math.ceil(lesson.itemIds.length * CLEAR_RATIO);

export const currentLesson = (state, curriculum) => curriculum.lessons.find((l) => !isLessonCleared(state, l)) ?? null;

// Un nivel (lección) se desbloquea al superar el anterior.
export function unlockedLessons(state, curriculum) {
  const out = [];
  for (const lesson of curriculum.lessons) {
    out.push(lesson);
    if (!isLessonCleared(state, lesson)) break;
  }
  return out;
}

// Coronas 0..3: suben cuando TODOS los ítems de la lección se recuerdan tras repasos espaciados.
export function lessonCrowns(state, lesson) {
  const items = lesson.itemIds.map((id) => state.items[id]);
  if (items.some((it) => !it)) return 0;
  return Math.min(MAX_CROWNS, ...items.map((it) => it.level));
}

export const isUnitCleared = (state, unit) => unit.lessons.every((l) => isLessonCleared(state, l));

// El role-play (con IA) se habilita al superar todas las lecciones de la unidad.
export const roleplayAvailable = (state, unit) => isUnitCleared(state, unit) && !state.roleplays.includes(unit.id);

function touchStreak(state, day) {
  if (state.streak.last === day) return;
  state.streak = { days: state.streak.last === day - 1 ? state.streak.days + 1 : 1, last: day };
}

// context: "learn" (aprendiendo) o "review" (repaso espaciado: mueve el calendario del ítem).
export function record(state, activity, correct, context, day) {
  const next = structuredClone(state);
  touchStreak(next, day);
  if (correct) next.xp += activity.xp;
  if (activity.itemId) {
    let item = next.items[activity.itemId] ?? { passes: 0, ...newItem(activity.itemId, activity.unitId, day) };
    if (correct) item = { ...item, passes: item.passes + 1 };
    if (context === "review") item = review(item, correct, day);
    next.items[activity.itemId] = item;
  }
  if (activity.extraId) next.extras[activity.extraId] = (next.extras[activity.extraId] ?? 0) + 1;
  return next;
}

export function completeRoleplay(state, unitId, turns, day) {
  if (turns < ROLEPLAY_MIN_TURNS || state.roleplays.includes(unitId)) return state;
  const next = structuredClone(state);
  touchStreak(next, day);
  next.xp += TYPES.roleplay.xp;
  next.roleplays.push(unitId);
  return next;
}

// Repasos vencidos, mezclando unidades; la dificultad sube con el nivel espaciado de cada ítem.
export function nextReviews(state, curriculum, day, rng, limit) {
  let cursor = { pos: 0, previous: null };
  const out = [];
  for (const it of dueItems(Object.values(state.items), day, limit)) {
    const item = curriculum.items.get(it.id);
    const step = Math.min(it.level, 3); // nivel espaciado del ítem = escalón de dificultad
    const pool = distractorPool(curriculum.unitOf(item.unitId), item.lessonId);
    const result = nextItemActivity(item, step, pool, cursor, rng);
    cursor = result.cursor;
    if (result.activity) out.push(result.activity);
  }
  return out;
}

// Ejercicios de unidad que rotan entre lecciones: cada lección suma EXTRAS_PER_LESSON y, a lo largo de la unidad,
// pasan todos los tipos (errores, diálogos, transformaciones, historias, consigna guiada). La unidad define dónde arranca la rotación.
export function extraActivities(state, unit, count, rng) {
  const available = EXTRA_TYPES.filter((t) => extraCount(unit, t) > 0);
  // Solo cuentan los ejercicios de la rotación (el emparejado de oraciones se suma aparte).
  const done = Object.entries(state.extras)
    .filter(([id]) => id.startsWith(`${unit.id}:`) && EXTRA_TYPES.includes(id.split(":")[1]))
    .reduce((sum, [, times]) => sum + times, 0);
  const out = [];
  for (let k = 0; k < count && available.length; k++) {
    let type = EXTRA_TYPES[(unit.index + done + k) % EXTRA_TYPES.length];
    for (let j = 1; !available.includes(type); j++) type = EXTRA_TYPES[(unit.index + done + k + j) % EXTRA_TYPES.length];
    // Dentro de cada tipo se usa el material que menos veces se hizo.
    let entry = 0;
    let least = Infinity;
    for (let i = 0; i < extraCount(unit, type); i++) {
      const times = state.extras[`${unit.id}:${type}:${i}`] ?? 0;
      if (times < least) [entry, least] = [i, times];
    }
    out.push(makeExtraActivity(type, unit, entry, least > 0 ? 1 : 0, rng));
  }
  // La unidad de conectores suma en cada lección el emparejado de comienzos y finales de oraciones.
  const sets = unit.extras.matchSets ?? [];
  if (sets.length) {
    const times = sets.map((_, i) => state.extras[`${unit.id}:match:${i}`] ?? 0);
    out.push(makeSentenceMatch(unit, times.indexOf(Math.min(...times)), rng));
  }
  return out;
}

// Una tanda de práctica de la lección: ejercicios de los ítems que aún no están aprendidos
// (primero reconocer/imitar, después producir), rotando el tipo, más los ejercicios de unidad.
export function lessonActivities(state, curriculum, lesson, rng, { extras = true } = {}) {
  const unit = curriculum.unitOf(lesson.unitId);
  let cursor = { pos: hash(lesson.id) % ITEM_TYPES.length, previous: null };
  const pool = distractorPool(unit, lesson.id);
  const out = [];
  for (const id of lesson.itemIds) {
    const passes = passesOf(state, id);
    if (passes >= PASSES_TO_CLEAR) continue;
    const result = nextItemActivity(curriculum.items.get(id), passes === 0 ? 0 : 2, pool, cursor, rng);
    cursor = result.cursor;
    if (result.activity) out.push(result.activity);
  }
  if (extras) out.push(...extraActivities(state, unit, EXTRAS_PER_LESSON, rng));
  return out;
}

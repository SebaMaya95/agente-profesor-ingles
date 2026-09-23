// Reglas del juego: progreso, XP, niveles, coronas, repasos. Todo en código, sin tokens.
import { makeActivity, pickType, typesFor } from "./activities.js";
import { phraseIndex, poolFor } from "./curriculum.js";
import { dueItems, newItem, review } from "./scheduler.js";

export const PASSES_TO_CLEAR = 2; // aciertos por frase para darla por aprendida en la sesión
export const CLEAR_RATIO = 0.8; // proporción de frases del nivel que hay que aprender
export const ROLEPLAY_XP = 30;
export const ROLEPLAY_MIN_TURNS = 3;
export const MAX_CROWNS = 3;

export const newState = () => ({ version: 2, xp: 0, streak: { days: 0, last: null }, phrases: {}, roleplays: [] });

const passesOf = (state, phraseId) => state.phrases[phraseId]?.passes ?? 0;

export const isCleared = (state, level) =>
  level.phrases.filter((p) => passesOf(state, p.id) >= PASSES_TO_CLEAR).length >=
  Math.ceil(level.phrases.length * CLEAR_RATIO);

// Primer nivel sin superar (null si terminó todos).
export const currentLevel = (state, curriculum) => curriculum.levels.find((l) => !isCleared(state, l)) ?? null;

// Un nivel se desbloquea al superar el anterior.
export function unlockedLevels(state, curriculum) {
  const out = [];
  for (const level of curriculum.levels) {
    out.push(level);
    if (!isCleared(state, level)) break;
  }
  return out;
}

// Coronas 0..3: suben cuando TODAS las frases del nivel se recuerdan tras repasos espaciados.
export function crowns(state, level) {
  const items = level.phrases.map((p) => state.phrases[p.id]);
  if (items.some((it) => !it)) return 0;
  return Math.min(MAX_CROWNS, ...items.map((it) => it.level));
}

export const roleplayAvailable = (state, level) => isCleared(state, level) && !state.roleplays.includes(level.id);

function touchStreak(state, day) {
  if (state.streak.last === day) return;
  state.streak = { days: state.streak.last === day - 1 ? state.streak.days + 1 : 1, last: day };
}

// context: "learn" (aprendiendo la frase) o "review" (repaso espaciado: mueve el calendario).
export function record(state, activity, correct, context, day) {
  const next = structuredClone(state);
  touchStreak(next, day);
  let item = next.phrases[activity.phraseId] ?? { passes: 0, ...newItem(activity.phraseId, activity.levelId, day) };
  if (correct) {
    item = { ...item, passes: item.passes + 1 };
    next.xp += activity.xp;
  }
  if (context === "review") item = review(item, correct, day);
  next.phrases[activity.phraseId] = item;
  return next;
}

export function completeRoleplay(state, levelId, turns, day) {
  if (turns < ROLEPLAY_MIN_TURNS || state.roleplays.includes(levelId)) return state;
  const next = structuredClone(state);
  touchStreak(next, day);
  next.xp += ROLEPLAY_XP;
  next.roleplays.push(levelId);
  return next;
}

// Repasos vencidos, mezclando niveles; la dificultad sube con el nivel espaciado de cada frase.
export function nextReviews(state, curriculum, day, rng, limit) {
  const index = phraseIndex(curriculum);
  let previous = null;
  return dueItems(Object.values(state.phrases), day, limit).map((item) => {
    const phrase = index.get(item.id);
    const type = pickType(typesFor(item.level), previous, rng);
    previous = type;
    return makeActivity(type, phrase, poolFor(curriculum, phrase), rng);
  });
}

// Una tanda de práctica para las frases del nivel que aún no están aprendidas:
// primero reconocer/imitar (0 aciertos), después producir (1 acierto).
export function learnActivities(state, curriculum, level, rng) {
  const index = phraseIndex(curriculum);
  let previous = null;
  return level.phrases
    .filter((p) => passesOf(state, p.id) < PASSES_TO_CLEAR)
    .map((p) => {
      const phrase = index.get(p.id);
      const type = pickType(typesFor(passesOf(state, p.id) === 0 ? 0 : 2), previous, rng);
      previous = type;
      return makeActivity(type, phrase, poolFor(curriculum, phrase), rng);
    });
}

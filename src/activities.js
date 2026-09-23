// Banco de actividades: los 12 tipos de ejercicio. Se arman y corrigen en código (0 tokens),
// salvo el role-play, que usa el modelo (ver tutor.js).
import { gradeAnyOf, gradePhrase, normalize, sameSentence, similarity } from "./grading.js";
import { pick, shuffle } from "./rng.js";

// scope "item": sale de una palabra o frase del vocabulario. scope "unit": usa material escrito por unidad.
export const TYPES = {
  "listen-choose": { skill: "Escuchar", xp: 8, scope: "item" },
  cloze: { skill: "Completar", xp: 10, scope: "item" },
  match: { skill: "Relacionar", xp: 12, scope: "item" },
  "say-it": { skill: "Hablar", xp: 15, scope: "item" },
  order: { skill: "Armar la frase", xp: 12, scope: "item" },
  shadow: { skill: "Repetir en voz alta", xp: 12, scope: "item" },
  "spot-error": { skill: "Detectar y corregir el error", xp: 10, scope: "unit" },
  dialogue: { skill: "Completar el diálogo", xp: 12, scope: "unit" },
  transform: { skill: "Transformar la oración", xp: 15, scope: "unit" },
  story: { skill: "Historia con opciones", xp: 20, scope: "unit" },
  guided: { skill: "Consigna guiada", xp: 20, scope: "unit" },
  roleplay: { skill: "Role-play con IA", xp: 30, scope: "unit" },
};

// Orden de rotación de los ejercicios de ítem y de los de unidad.
export const ITEM_TYPES = ["listen-choose", "cloze", "say-it", "match", "order", "shadow"];
export const EXTRA_TYPES = ["spot-error", "dialogue", "transform", "story", "guided"];

// Escalera de dificultad: 0 = ítem nuevo o fallado (reconocer e imitar) ... 3 = producir de memoria.
const LADDER = [
  ["listen-choose", "cloze", "match", "shadow"],
  ["cloze", "match", "order", "shadow"],
  ["say-it", "order", "cloze", "shadow"],
  ["say-it", "order", "match"],
];
export const typesFor = (step) => LADDER[Math.min(step, LADDER.length - 1)];

const core = (token) => token.replace(/^[^\p{L}\p{N}']+|[^\p{L}\p{N}']+$/gu, "");
const stemMatch = (token, word) => word.length >= 3 && token.startsWith(word) && token.length - word.length <= 2;

// Busca en la oración la palabra (o frase) del ítem, tolerando plurales y conjugaciones simples.
export function findKey(item, example) {
  const tokens = example.split(/\s+/);
  for (const variant of [...item.variants].sort((a, b) => b.length - a.length)) {
    const words = variant.split(/\s+/).map(normalize);
    if (words.some((w) => !w)) continue;
    for (let i = 0; i + words.length <= tokens.length; i++) {
      const window = tokens.slice(i, i + words.length);
      const same = window.every((t, j) => {
        const n = normalize(core(t));
        return n === words[j] || (words.length === 1 && stemMatch(n, words[j]));
      });
      if (same) return { start: i, length: words.length, text: window.map(core).join(" ") };
    }
  }
  return null;
}

const STOP = new Set([
  "that", "this", "with", "from", "have", "your", "they", "them", "then", "than", "what", "when", "where",
  "which", "there", "their", "about", "would", "could", "should", "because", "every", "before", "after",
  "while", "these", "those", "been", "were", "will", "does", "doing", "into", "over", "some", "much", "very", "also", "just", "only", "like",
]);
const isContentWord = (w) => w.length >= 4 && !/^[A-Z]/.test(w) && !/\d/.test(w) && !STOP.has(w.toLowerCase());

// Si la palabra del ítem no aparece en la oración, se tapa la palabra de contenido más larga.
function fallbackKey(example) {
  let best = null;
  example.split(/\s+/).forEach((token, i) => {
    const text = core(token);
    if (i === 0 || !isContentWord(text)) return;
    if (!best || text.length > best.text.length) best = { start: i, length: 1, text };
  });
  return best;
}

// Distractores para ese caso: palabras de contenido de otras oraciones de la unidad, de largo parecido.
function contentDistractors(pool, match, example, rng) {
  const inSentence = new Set(example.split(/\s+/).map((t) => normalize(core(t))));
  const words = new Map();
  for (const p of pool) {
    for (const ex of p.examples) {
      for (const token of ex.split(/\s+/)) {
        const w = core(token);
        if (isContentWord(w)) words.set(normalize(w), w);
      }
    }
  }
  const target = normalize(match.text);
  const initials = new Set([target[0]]);
  const out = [];
  for (const [n, w] of shuffle([...words.entries()], rng)) {
    if (inSentence.has(n) || initials.has(n[0]) || Math.abs(w.length - match.text.length) > 3) continue;
    initials.add(n[0]);
    out.push(w);
    if (out.length === 2) break;
  }
  return out;
}

function blankSentence(example, match) {
  const tokens = example.split(/\s+/);
  const leading = tokens[match.start].match(/^[^\p{L}\p{N}']+/u)?.[0] ?? "";
  const trailing = tokens[match.start + match.length - 1].match(/[^\p{L}\p{N}']+$/u)?.[0] ?? "";
  tokens.splice(match.start, match.length, `${leading}___${trailing}`);
  return tokens.join(" ");
}

const baseOf = (type, item) => ({
  type,
  itemId: item.id,
  unitId: item.unitId,
  skill: TYPES[type].skill,
  xp: TYPES[type].xp,
});

function distractorWords(item, pool, match, example, rng) {
  // Las opciones siguen las mayúsculas del lugar del hueco: "Data Analyst" pasa a "data analyst" si no va al inicio.
  const lower = (w) => w.split(" ").map((t) => (/^[A-Z][a-z]+$/.test(t) ? t.toLowerCase() : t)).join(" ");
  const adapt = (w) => (match.start === 0 ? w[0].toUpperCase() + w.slice(1) : lower(w));
  const inSentence = normalize(example);
  const seen = new Set([normalize(match.text)]);
  const out = [];
  for (const p of shuffle(pool.filter((q) => q.id !== item.id), rng)) {
    const word = p.variants[0];
    const n = normalize(word);
    if (word.split(" ").length !== match.length || seen.has(n) || inSentence.includes(n)) continue;
    seen.add(n);
    out.push(adapt(word));
    if (out.length === 2) break;
  }
  return out;
}

// Ejercicios de ítem. Devuelven null si el ítem no tiene material para ese tipo.
export function makeItemActivity(type, item, pool, rng = Math.random) {
  const base = baseOf(type, item);
  switch (type) {
    case "listen-choose": {
      const meanings = [...new Set(shuffle(pool.filter((p) => p.id !== item.id && p.es && p.es !== item.es), rng).map((p) => p.es))].slice(0, 2);
      if (!item.es || meanings.length < 2) return null;
      const options = shuffle([item.es, ...meanings], rng);
      return { ...base, prompt: "Escuchá y elegí qué significa", say: item.variants[0], options, correctIndex: options.indexOf(item.es) };
    }
    case "cloze": {
      for (const example of shuffle(item.examples, rng)) {
        const headword = findKey(item, example);
        const match = headword ?? fallbackKey(example);
        // Hace falta contexto: una oración de 3+ palabras donde el hueco tape menos de la mitad.
        if (!match || example.split(/\s+/).length < 3 || match.length * 2 >= example.split(/\s+/).length) continue;
        const distractors = headword ? distractorWords(item, pool, match, example, rng) : contentDistractors(pool, match, example, rng);
        if (distractors.length < 2) continue;
        const options = shuffle([match.text, ...distractors], rng);
        return { ...base, prompt: "Completá la oración", hint: item.es, text: blankSentence(example, match), options, correctIndex: options.indexOf(match.text) };
      }
      return null;
    }
    case "match": {
      const chosen = [];
      const seen = new Set([item.es]);
      for (const p of shuffle(pool.filter((q) => q.id !== item.id && q.es), rng)) {
        if (seen.has(p.es)) continue;
        seen.add(p.es);
        chosen.push(p);
        if (chosen.length === 3) break;
      }
      if (!item.es || chosen.length < 2) return null;
      const pairs = shuffle([item, ...chosen], rng).map((p) => ({ left: p.variants[0], right: p.es }));
      const rights = shuffle(pairs.map((p) => p.right), rng);
      return { ...base, prompt: "Uní cada palabra con su significado", pairs, rights, answer: pairs.map((p) => rights.indexOf(p.right)) };
    }
    case "say-it":
      if (!item.es) return null;
      return { ...base, prompt: `Decilo en inglés: ${item.es}`, target: { en: item.variants[0], accepted: item.variants } };
    case "order": {
      const answer = shuffle(item.examples.filter((e) => e.split(/\s+/).length >= 3), rng)[0];
      if (!answer) return null;
      const words = answer.split(/\s+/);
      let mixed = shuffle(words, rng);
      for (let i = 0; i < 5 && mixed.join(" ") === answer; i++) mixed = shuffle(words, rng);
      return { ...base, prompt: "Armá la frase", hint: item.es, words: mixed, answer };
    }
    case "shadow": {
      const example = pick(item.examples, rng);
      return { ...base, prompt: "Escuchá y repetí en voz alta", say: example, target: { en: example, key: findKey(item, example)?.text } };
    }
    default:
      throw new Error(`Tipo de ejercicio de ítem desconocido: ${type}`);
  }
}

// Elige el próximo ejercicio de un ítem rotando por los tipos permitidos según su nivel.
// cursor: { pos, previous } para recorrer la rotación sin repetir el tipo seguido.
export function nextItemActivity(item, step, pool, cursor, rng = Math.random) {
  const n = ITEM_TYPES.length;
  for (const allowed of [typesFor(step), ITEM_TYPES]) {
    for (const avoidPrevious of [true, false]) {
      for (let i = 0; i < n; i++) {
        const type = ITEM_TYPES[(cursor.pos + i) % n];
        if (!allowed.includes(type) || (avoidPrevious && type === cursor.previous)) continue;
        const activity = makeItemActivity(type, item, pool, rng);
        if (activity) return { activity, cursor: { pos: (cursor.pos + i + 1) % n, previous: type } };
      }
    }
  }
  return { activity: null, cursor };
}

// Relacionar oraciones y conectores: unir el comienzo de cada oración con su final (unidad de conectores).
export function makeSentenceMatch(unit, setIndex, rng = Math.random) {
  const set = unit.extras.matchSets[setIndex];
  const pairs = shuffle(set, rng).map((p) => ({ left: p.left, right: p.right }));
  const rights = shuffle(pairs.map((p) => p.right), rng);
  return {
    type: "match",
    variant: "halves",
    unitId: unit.id,
    extraId: `${unit.id}:match:${setIndex}`,
    skill: "Relacionar oraciones",
    xp: TYPES.match.xp,
    prompt: "Uní cada comienzo de oración con su final",
    pairs,
    rights,
    answer: pairs.map((p) => rights.indexOf(p.right)),
  };
}

const FORMS = ["affirmative", "negative", "interrogative"];
const FORM_LABEL = { affirmative: "afirmativa", negative: "negativa", interrogative: "pregunta" };

export function extraCount(unit, type) {
  const e = unit.extras;
  return { "spot-error": e.errors?.length, dialogue: e.dialogues?.length, transform: e.transforms?.length, story: e.story ? 1 : 0, guided: unit.guided ? 1 : 0 }[type] ?? 0;
}

// Ejercicios de unidad, con el material escrito para cada categoría. step 0 = primera vez, 1 = ya se hizo (más exigente).
export function makeExtraActivity(type, unit, entryIndex, step, rng = Math.random) {
  const base = { type, unitId: unit.id, extraId: `${unit.id}:${type}:${entryIndex}`, skill: TYPES[type].skill, xp: TYPES[type].xp };
  switch (type) {
    case "spot-error": {
      const e = unit.extras.errors[entryIndex];
      const target = { en: e.correct, wrong: e.wrong };
      if (step === 0) {
        const options = shuffle([e.correct, e.wrong], rng);
        return { ...base, mode: "choose", prompt: "¿Cuál está bien dicha?", options, correctIndex: options.indexOf(e.correct), target };
      }
      return { ...base, mode: "fix", prompt: "Esta oración tiene un error. Decila o escribila bien.", text: e.wrong, target };
    }
    case "dialogue": {
      const d = unit.extras.dialogues[entryIndex];
      const answer = d.turns[d.gap].text;
      const turns = d.turns.map((t, i) => (i === d.gap ? { who: t.who, text: null } : t));
      if (step === 0) {
        const options = shuffle([answer, ...d.distractors.slice(0, 2)], rng);
        return { ...base, mode: "choose", prompt: "Elegí la respuesta que falta", turns, options, correctIndex: options.indexOf(answer), target: { en: answer } };
      }
      return { ...base, mode: "say", prompt: "Decí o escribí la respuesta que falta", turns, target: { en: answer } };
    }
    case "transform": {
      const t = unit.extras.transforms[entryIndex];
      const [from, to] = pick(FORMS.flatMap((a) => FORMS.filter((b) => b !== a).map((b) => [a, b])), rng);
      return { ...base, prompt: `Pasá a ${FORM_LABEL[to]}`, source: t.forms[from], answer: t.forms[to], toForm: to, tense: t.tense };
    }
    case "story":
      return { ...base, prompt: `Historia: ${unit.extras.story.title}`, story: unit.extras.story };
    case "guided": {
      const { prompt, requirements, min, sample } = unit.guided;
      return { ...base, prompt, requirements, min, sample };
    }
    default:
      throw new Error(`Tipo de ejercicio de unidad desconocido: ${type}`);
  }
}

// --- Corrección -------------------------------------------------------------

export const guidedMatches = (activity, response) => {
  const text = normalize(String(response));
  return activity.requirements.filter((r) => new RegExp(r.re, "i").test(text));
};

export const guidedMissing = (activity, response) => {
  const done = new Set(guidedMatches(activity, response));
  return activity.requirements.filter((r) => !done.has(r));
};

export function storyStep(story, nodeId, optionIndex) {
  const node = story.nodes[nodeId];
  const option = node.options[optionIndex];
  if (!option) return null;
  return { good: Boolean(option.good), next: option.next, best: node.options.find((o) => o.good).text };
}

const fixed = (r, target) => {
  const good = similarity(r, target.en);
  return good >= 0.9 && good > similarity(r, target.wrong);
};

// response: índice (ejercicios de opciones), lista de índices (match), lista de aciertos (story) o texto.
export function checkActivity(a, response) {
  switch (a.type) {
    case "listen-choose":
    case "cloze":
      return response === a.correctIndex;
    case "spot-error":
      return a.mode === "choose" ? response === a.correctIndex : fixed(String(response), a.target);
    case "dialogue":
      return a.mode === "choose" ? response === a.correctIndex : similarity(String(response), a.target.en) >= 0.85;
    case "match":
      return Array.isArray(response) && response.length === a.answer.length && response.every((r, i) => r === a.answer[i]);
    case "order":
      return sameSentence(Array.isArray(response) ? response.join(" ") : String(response), a.answer);
    case "say-it":
      return gradeAnyOf(String(response), a.target.accepted);
    case "shadow":
      return gradePhrase(String(response), a.target);
    case "transform":
      return sameSentence(String(response), a.answer);
    case "story":
      // Se aprueba con al menos 2 de cada 3 respuestas buenas.
      return Array.isArray(response) && response.length > 0 && response.filter(Boolean).length * 3 >= response.length * 2;
    case "guided":
      return guidedMatches(a, response).length >= a.min;
    default:
      throw new Error(`Tipo de ejercicio desconocido: ${a.type}`);
  }
}

// Texto para mostrar la respuesta correcta cuando el alumno falla.
export function correctAnswer(a) {
  switch (a.type) {
    case "match":
      return a.pairs.map((p) => `${p.left} = ${p.right}`).join(" | ");
    case "order":
    case "transform":
      return a.answer;
    case "guided":
      return a.sample;
    case "story":
      return "";
    default:
      return a.options ? a.options[a.correctIndex] : a.target.en;
  }
}

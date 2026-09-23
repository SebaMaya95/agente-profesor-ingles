// Banco de actividades: se arman en código a partir de las frases del currículo. 0 tokens.
import { gradePhrase, normalize } from "./grading.js";
import { pick, shuffle } from "./rng.js";

export const TYPES = {
  "listen-choose": { skill: "Escuchar", xp: 8 },
  "spot-error": { skill: "Detectar el error", xp: 8 },
  cloze: { skill: "Completar", xp: 10 },
  order: { skill: "Armar la frase", xp: 12 },
  shadow: { skill: "Repetir en voz alta", xp: 12 },
  "say-it": { skill: "Hablar", xp: 15 },
};

// Escalera de dificultad: 0 = frase nueva o fallada (reconocer e imitar) ... 3 = producir de memoria.
const LADDER = [
  ["listen-choose", "spot-error", "shadow"],
  ["cloze", "order", "shadow"],
  ["say-it", "order", "cloze"],
  ["say-it", "order"],
];

export const typesFor = (step) => LADDER[Math.min(step, LADDER.length - 1)];

// Evita repetir el mismo tipo dos veces seguidas.
export function pickType(types, previous, rng = Math.random) {
  const options = types.filter((t) => t !== previous);
  return pick(options.length ? options : types, rng);
}

const blank = (phrase) => {
  let done = false;
  return phrase.en
    .split(" ")
    .map((token) => {
      if (!done && normalize(token) === normalize(phrase.key)) {
        done = true;
        return token.replace(/[\p{L}\p{N}'’]+/u, "___");
      }
      return token;
    })
    .join(" ");
};

const choice = (base, options, right, extra) => ({
  ...base,
  ...extra,
  options,
  correctIndex: options.indexOf(right),
});

export function makeActivity(type, phrase, pool, rng = Math.random) {
  const others = shuffle(
    pool.filter((p) => p.id !== phrase.id),
    rng,
  );
  const base = {
    type,
    phraseId: phrase.id,
    levelId: phrase.levelId,
    skill: TYPES[type].skill,
    xp: TYPES[type].xp,
    target: { en: phrase.en, key: phrase.key, wrong: phrase.wrong },
  };

  switch (type) {
    case "listen-choose": {
      const options = shuffle([phrase.es, ...others.slice(0, 2).map((p) => p.es)], rng);
      return choice(base, options, phrase.es, { prompt: "Escuchá y elegí qué significa", say: phrase.en });
    }
    case "spot-error": {
      const options = shuffle([phrase.en, phrase.wrong], rng);
      return choice(base, options, phrase.en, { prompt: `¿Cuál está bien dicha? (${phrase.es})` });
    }
    case "cloze": {
      const keys = [...new Set(others.map((p) => p.key))].filter((k) => normalize(k) !== normalize(phrase.key));
      const options = shuffle([phrase.key, ...keys.slice(0, 2)], rng);
      return choice(base, options, phrase.key, { prompt: phrase.es, text: blank(phrase) });
    }
    case "order": {
      const words = phrase.en.split(" ");
      let mixed = shuffle(words, rng);
      for (let i = 0; i < 5 && mixed.join(" ") === phrase.en; i++) mixed = shuffle(words, rng);
      return { ...base, prompt: `Armá la frase: ${phrase.es}`, words: mixed, answer: phrase.en };
    }
    case "shadow":
      return { ...base, prompt: "Escuchá y repetí en voz alta", say: phrase.en };
    case "say-it":
      return { ...base, prompt: `Decilo en inglés: ${phrase.es}` };
    default:
      throw new Error(`Tipo de actividad desconocido: ${type}`);
  }
}

// response: número (índice) en las de opciones; texto o lista de palabras en las demás.
export function checkActivity(activity, response) {
  if (activity.options) return response === activity.correctIndex;
  if (activity.type === "order") {
    const said = Array.isArray(response) ? response.join(" ") : String(response);
    return normalize(said) === normalize(activity.answer);
  }
  return gradePhrase(String(response), activity.target);
}

export const correctAnswer = (activity) =>
  activity.options ? activity.options[activity.correctIndex] : activity.target.en;

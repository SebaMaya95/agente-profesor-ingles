// Corrección en código (sin modelo, sin tokens).

const CONTRACTIONS = [
  [/won't/g, "will not"],
  [/can't/g, "can not"],
  [/n't/g, " not"],
  [/'m\b/g, " am"],
  [/'re\b/g, " are"],
  [/'ll\b/g, " will"],
  [/'ve\b/g, " have"],
];

// Minúsculas, sin acentos ni puntuación, con contracciones expandidas ("doesn't" = "does not").
export const normalize = (s) => {
  let t = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’‘]/g, "'");
  for (const [re, to] of CONTRACTIONS) t = t.replace(re, to);
  return t
    .replace(/'/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export function distance(a, b) {
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length];
}

export function similarity(a, b) {
  const x = normalize(a);
  const y = normalize(b);
  const longest = Math.max(x.length, y.length);
  return longest ? 1 - distance(x, y) / longest : 1;
}

export const sameSentence = (a, b) => normalize(a) === normalize(b);

// Corrige una frase dicha o escrita. Tolera pequeñas diferencias (típicas del reconocimiento de voz),
// pero exige la palabra clave (si hay) y rechaza lo que se parece más al error típico que a la frase correcta.
export function gradePhrase(response, phrase, threshold = 0.85) {
  const key = phrase.key ? normalize(phrase.key) : null;
  const hasKey = !key || ` ${normalize(response)} `.includes(` ${key} `);
  const good = similarity(response, phrase.en);
  const bad = phrase.wrong ? similarity(response, phrase.wrong) : 0;
  return hasKey && good >= threshold && good > bad;
}

// Palabras sueltas: coincidencia exacta. Frases: tolerancia por similitud.
export function gradeAnyOf(response, accepted, threshold = 0.85) {
  const said = normalize(response);
  return accepted.some((a) => {
    const target = normalize(a);
    return target.includes(" ") ? similarity(said, target) >= threshold : said === target;
  });
}

// Corrección de respuestas de vocabulario en código (sin modelo, sin tokens).

export const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const isCorrect = (answer, accepted) =>
  accepted.some((a) => normalize(a) === normalize(answer));

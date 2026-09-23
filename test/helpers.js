// Respuestas de prueba para cualquier tipo de ejercicio (usadas por los "alumnos bot" de las pruebas).

export function rightResponse(a) {
  switch (a.type) {
    case "listen-choose":
    case "cloze":
      return a.correctIndex;
    case "spot-error":
    case "dialogue":
      return a.options ? a.correctIndex : a.target.en;
    case "match":
    case "order":
    case "transform":
      return a.answer;
    case "say-it":
      return a.target.accepted[0];
    case "shadow":
      return a.target.en;
    case "story":
      return [true, true, true];
    case "guided":
      return a.sample;
    default:
      throw new Error(`sin respuesta para ${a.type}`);
  }
}

export function wrongResponse(a) {
  if (a.type === "story") return [false, false, false];
  if (a.type === "match") {
    const swapped = [...a.answer]; // la respuesta es una permutación: intercambiar dos la vuelve distinta
    [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
    return swapped;
  }
  if (a.options) return (a.correctIndex + 1) % a.options.length;
  if (a.type === "spot-error") return a.target.wrong;
  return "zzz";
}

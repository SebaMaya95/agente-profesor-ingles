import { deepFill } from "./contenido.js";

const LESSON_MAX = 6; // ítems por lección

// Reparte n ítems en lecciones parejas de hasta LESSON_MAX (7 -> 4+3, 16 -> 6+6+4).
function chunk(items) {
  const parts = Math.ceil(items.length / LESSON_MAX);
  const size = Math.ceil(items.length / parts);
  return Array.from({ length: parts }, (_, i) => items.slice(i * size, (i + 1) * size));
}

// "Basic details (Datos básicos)" -> { en: "Basic details", es: "Datos básicos" }; sin paréntesis, el mismo texto en ambos.
const splitTitle = (title) => {
  const m = title.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  return m ? { en: m[1], es: m[2] } : { en: title, es: title };
};

const toItem = (raw, unitId, lessonId) => ({
  id: raw.id,
  unitId,
  lessonId,
  en: raw.en,
  es: raw.es || null,
  examples: raw.examples,
  variants: raw.en.split("/").map((s) => s.trim()).filter(Boolean), // "Father / Dad" -> ["Father", "Dad"]
});

// Arma el curso: 12 unidades (una por categoría), cada una dividida en lecciones cortas.
// content: { vocabulario, tiempos, unidades, actividades } (JSON de data/contenido).
// Los textos se completan con el perfil del alumno ({{name}}, {{father}}...).
export function buildCurriculum(content, perfil) {
  const vocab = deepFill(content.vocabulario, perfil);
  const tiempos = deepFill(content.tiempos, perfil);
  const unidades = deepFill(content.unidades, perfil);
  const actividades = deepFill(content.actividades, perfil);
  const tenseById = new Map(tiempos.tenses.map((t) => [t.id, t]));
  const categoryById = new Map(vocab.categories.map((c) => [c.id, c]));

  const items = new Map();
  const units = unidades.units.map((u, index) => {
    const category = categoryById.get(u.id);
    const lessons = [];
    for (const group of category.groups) {
      const parts = chunk(group.items);
      const name = splitTitle(group.title);
      parts.forEach((part, i) => {
        const id = `${u.id}.l${lessons.length + 1}`;
        const suffix = parts.length > 1 ? ` (${i + 1}/${parts.length})` : "";
        for (const raw of part) items.set(raw.id, toItem(raw, u.id, id));
        lessons.push({ id, unitId: u.id, title: `${name.en}${suffix}`, titleEs: `${name.es}${suffix}`, itemIds: part.map((p) => p.id) });
      });
    }
    return {
      id: u.id,
      index,
      title: category.title,
      titleEs: category.titleEs,
      situation: u.situation,
      tenses: u.tenses.map((id) => tenseById.get(id)),
      roleplay: u.roleplay,
      guided: { id: `${u.id}:guided`, ...u.guided },
      extras: actividades[u.id],
      lessons,
      itemList: lessons.flatMap((l) => l.itemIds).map((id) => items.get(id)),
    };
  });

  return {
    units,
    lessons: units.flatMap((u) => u.lessons),
    items,
    unitOf: (id) => units.find((u) => u.id === id),
  };
}

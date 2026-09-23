// Planificador de repasos: repetición espaciada con recuperación (ver docs/metodologia.md).
// Todo es código determinístico: no consume tokens.

export const INTERVALS_DAYS = [1, 3, 7, 14, 30];
const DAY_MS = 86_400_000;

export const dayNumber = (now = Date.now()) => Math.floor(now / DAY_MS);

export function newItem(id, lesson, day) {
  return { id, lesson, level: 0, due: day + INTERVALS_DAYS[0] };
}

// Acierto: sube un nivel (intervalo más largo). Error: vuelve al primer intervalo.
export function review(item, correct, day) {
  const level = correct ? Math.min(item.level + 1, INTERVALS_DAYS.length - 1) : 0;
  return { ...item, level, due: day + INTERVALS_DAYS[level] };
}

// Ítems vencidos, los más atrasados primero, mezclando temas (intercalado).
export function dueItems(items, day, limit) {
  const due = items.filter((it) => it.due <= day).sort((a, b) => a.due - b.due);
  return interleave(due).slice(0, limit);
}

// Reparte por turnos entre temas para que no salgan seguidos del mismo tema.
export function interleave(items) {
  const groups = new Map();
  for (const it of items) {
    if (!groups.has(it.lesson)) groups.set(it.lesson, []);
    groups.get(it.lesson).push(it);
  }
  const queues = [...groups.values()];
  const out = [];
  while (queues.some((q) => q.length)) {
    for (const q of queues) if (q.length) out.push(q.shift());
  }
  return out;
}

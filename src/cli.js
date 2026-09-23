import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadCurriculum, itemsOf, itemIndex } from "./curriculum.js";
import { loadState, saveState } from "./state.js";
import { dayNumber, dueItems, newItem, review } from "./scheduler.js";
import { isCorrect } from "./grading.js";
import { describeError, hasApiKey, reply, usage } from "./tutor.js";

const MAX_REVIEWS = 3;
const MAX_TURNS = 4;
const useAi = hasApiKey() && !process.argv.includes("--no-ai");

const rl = createInterface({ input });
const lines = rl[Symbol.asyncIterator]();

// Lee una línea; devuelve null si se cierra la entrada (Ctrl+D o fin de un pipe).
async function ask(question) {
  output.write(question);
  const { value, done } = await lines.next();
  return done ? null : value;
}

const curriculum = loadCurriculum();
const index = itemIndex(curriculum);
const state = loadState();
const day = dayNumber();

// 1. Repaso espaciado: preguntas y corrección en código, sin tokens.
const due = dueItems(Object.values(state.items), day, MAX_REVIEWS);
if (due.length) console.log(`\n== Repaso (${due.length}) ==`);
for (const it of due) {
  const q = index.get(it.id);
  const answer = await ask(`${q.prompt} `);
  if (answer === null) break;
  const ok = isCorrect(answer, q.answers);
  console.log(ok ? "✓ Correcto" : `✗ Era: ${q.answers[0]}`);
  state.items[it.id] = review(it, ok, day);
}

// 2. Tema nuevo, en bloque: se presenta desde los datos, sin tokens.
const lesson = curriculum.lessons.find((l) => !state.introduced.includes(l.id));
if (!lesson) {
  console.log("\nCompletaste todo el currículo actual. ¡Bien!");
} else {
  console.log(`\n== Tema nuevo: ${lesson.title} ==`);
  for (const w of lesson.words) console.log(`  ${w.en} = ${w.es}`);
  console.log(`  Patrón: ${lesson.pattern}`);
  for (const it of itemsOf(lesson)) state.items[it.id] = newItem(it.id, lesson.id, day);
  state.introduced.push(lesson.id);

  // 3. Conversación: único punto donde se usa el modelo.
  if (useAi) await converse(lesson);
  else console.log("\n(Conversación con IA desactivada: falta ANTHROPIC_API_KEY o se pasó --no-ai)");
}

saveState(state);
if (usage.calls) {
  console.log(`\nTokens de la sesión: ${usage.input} entrada, ${usage.output} salida, ${usage.calls} llamadas.`);
}
rl.close();

async function converse(lesson) {
  console.log("\n== Práctica (escribí 'salir' para terminar) ==");
  const history = [{ role: "user", content: "Hi! Let's practice." }];
  let turn = 0;
  while (turn < MAX_TURNS) {
    let text;
    try {
      text = await reply(lesson, history);
    } catch (error) {
      // El último mensaje del alumno sigue en el historial: reintentar no lo pierde.
      console.log(`\nNo se pudo usar la IA: ${describeError(error)}`);
      const again = await ask("Enter para reintentar, 'salir' para terminar: ");
      if (again === null || again.trim().toLowerCase() === "salir") break;
      continue;
    }
    turn++;
    console.log(`\nTutor: ${text}`);
    history.push({ role: "assistant", content: text });
    const said = (await ask("Vos: "))?.trim();
    if (!said || said.toLowerCase() === "salir") break;
    history.push({ role: "user", content: said });
  }
}

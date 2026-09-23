import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { checkActivity, correctAnswer } from "./activities.js";
import { loadCurriculum } from "./curriculum.js";
import {
  completeRoleplay,
  crowns,
  currentLevel,
  isCleared,
  learnActivities,
  nextReviews,
  record,
  roleplayAvailable,
  unlockedLevels,
} from "./game.js";
import { mulberry32 } from "./rng.js";
import { dayNumber } from "./scheduler.js";
import { loadState, saveState } from "./state.js";
import { describeError, hasApiKey, reply, usage } from "./tutor.js";

// Versión de consola: sirve para probar el motor. La interfaz final será la web (con voz).
const MAX_REVIEWS = 5;
const MAX_ROUNDS = 4;
const MAX_TURNS = 4;
const useAi = hasApiKey() && !process.argv.includes("--no-ai");
const rng = process.env.TUTOR_SEED ? mulberry32(Number(process.env.TUTOR_SEED)) : Math.random;

const rl = createInterface({ input });
const lines = rl[Symbol.asyncIterator]();

// Lee una línea; devuelve null si se cierra la entrada (Ctrl+D o fin de un pipe).
async function ask(question) {
  output.write(question);
  const { value, done } = await lines.next();
  return done ? null : value;
}

const curriculum = loadCurriculum();
const day = dayNumber();
let state = loadState();
const startXp = state.xp;

// Devuelve true/false según acierto, o null si se cerró la entrada.
async function play(activity, context) {
  console.log(`\n[${activity.skill}] ${activity.prompt}`);
  if (activity.say) console.log(`  (audio) "${activity.say}"`);
  if (activity.text) console.log(`  ${activity.text}`);
  activity.options?.forEach((option, i) => console.log(`  ${i + 1}) ${option}`));
  if (activity.words) console.log(`  ${activity.words.join(" / ")}`);
  const raw = await ask("> ");
  if (raw === null) return null;
  const ok = checkActivity(activity, activity.options ? Number.parseInt(raw, 10) - 1 : raw);
  console.log(ok ? `Correcto! +${activity.xp} XP` : `Era: ${correctAnswer(activity)}`);
  state = record(state, activity, ok, context, day);
  return ok;
}

async function playAll(activities, context) {
  for (const activity of activities) if ((await play(activity, context)) === null) return false;
  return true;
}

async function converse(level) {
  console.log(`\n== Role-play: ${level.roleplay.goal} (escribí 'salir' para terminar) ==`);
  const history = [{ role: "user", content: "Hi! Let's start." }];
  let turns = 0;
  while (turns < MAX_TURNS) {
    let text;
    try {
      text = await reply(level, history);
    } catch (error) {
      // El último mensaje del alumno sigue en el historial: reintentar no lo pierde.
      console.log(`\nNo se pudo usar la IA: ${describeError(error)}`);
      const again = await ask("Enter para reintentar, 'salir' para terminar: ");
      if (again === null || again.trim().toLowerCase() === "salir") break;
      continue;
    }
    turns++;
    console.log(`\nTutor: ${text}`);
    history.push({ role: "assistant", content: text });
    const said = (await ask("Vos: "))?.trim();
    if (!said || said.toLowerCase() === "salir") break;
    history.push({ role: "user", content: said });
  }
  state = completeRoleplay(state, level.id, turns, day);
}

let open = true;

// 1. Repaso espaciado de lo aprendido en días anteriores.
const reviews = nextReviews(state, curriculum, day, rng, MAX_REVIEWS);
if (reviews.length) {
  console.log("\n== Repaso ==");
  open = await playAll(reviews, "review");
}

// 2. Nivel actual: nota, frases y práctica hasta superarlo.
const level = currentLevel(state, curriculum);
if (open && !level) console.log("\nCompletaste todos los niveles disponibles.");
if (open && level) {
  const n = curriculum.levels.indexOf(level) + 1;
  console.log(`\n== Nivel ${n}: ${level.title} ==\n${level.situation}\nNota: ${level.grammarNote}`);
  if (level.phrases.some((p) => !state.phrases[p.id])) {
    for (const p of level.phrases) console.log(`  ${p.en}  =  ${p.es}`);
  }
  for (let round = 0; round < MAX_ROUNDS && open && !isCleared(state, level); round++) {
    open = await playAll(learnActivities(state, curriculum, level, rng), "learn");
  }
  if (open && isCleared(state, level)) {
    console.log("\nNivel superado!");
    if (roleplayAvailable(state, level) && useAi) await converse(level);
  }
}

saveState(state);

const unlocked = unlockedLevels(state, curriculum);
console.log("\n== Tu mapa ==");
curriculum.levels.forEach((l, i) => {
  const status = !unlocked.includes(l) ? "bloqueado" : isCleared(state, l) ? "superado" : "en curso";
  console.log(`  ${i + 1}. ${l.title}: ${status}, coronas ${crowns(state, l)}/3`);
});
console.log(`XP: ${state.xp} (+${state.xp - startXp} hoy) | Racha: ${state.streak.days} día(s)`);
if (usage.calls) {
  console.log(`Tokens de la sesión: ${usage.input} entrada, ${usage.output} salida, ${usage.calls} llamadas.`);
}
rl.close();

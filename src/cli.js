import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { checkActivity, correctAnswer, guidedMissing, storyStep } from "./activities.js";
import { loadCurriculum } from "./contenido-node.js";
import {
  completeRoleplay,
  currentLesson,
  isLessonCleared,
  isUnitCleared,
  lessonActivities,
  lessonCrowns,
  nextReviews,
  record,
  roleplayAvailable,
  unlockedLessons,
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

const say = (line = "") => console.log(line);

function showActivity(a) {
  say(`\n[${a.skill}] ${a.prompt}`);
  if (a.hint) say(`  (pista: ${a.hint})`);
  if (a.say) say(`  (audio) "${a.say}"`);
  if (a.source) say(`  ${a.source}`);
  if (a.text) say(`  ${a.text}`);
  a.turns?.forEach((t) => say(`  ${t.who}: ${t.text ?? "___"}`));
  a.options?.forEach((option, i) => say(`  ${i + 1}) ${option}`));
  if (a.words) say(`  ${a.words.join(" / ")}`);
  if (a.pairs) {
    a.pairs.forEach((p, i) => say(`  ${String.fromCharCode(65 + i)}) ${p.left}`));
    a.rights.forEach((r, i) => say(`  ${i + 1}) ${r}`));
    say("  (escribí los números en orden, por ejemplo: 2 1 4 3)");
  }
  if (a.requirements) say(`  Incluí: ${a.requirements.map((r) => r.label).join(" | ")}`);
}

// Recorre una historia con opciones. Devuelve la lista de aciertos, o null si se cerró la entrada.
async function playStory(activity) {
  const { story } = activity;
  const goods = [];
  let nodeId = story.start;
  for (;;) {
    const node = story.nodes[nodeId];
    say(`\n  ${node.npc}`);
    if (node.end) return goods;
    node.options.forEach((o, i) => say(`  ${i + 1}) ${o.text}`));
    const raw = await ask("> ");
    if (raw === null) return null;
    const step = storyStep(story, nodeId, Number.parseInt(raw, 10) - 1) ?? storyStep(story, nodeId, 0);
    goods.push(step.good);
    say(step.good ? "  Bien dicho." : `  Mejor: ${step.best}`);
    nodeId = step.next;
  }
}

// Devuelve true/false según acierto, o null si se cerró la entrada.
async function play(activity, context) {
  showActivity(activity);
  let response;
  if (activity.type === "story") {
    response = await playStory(activity);
  } else {
    const raw = await ask("> ");
    if (raw !== null) {
      if (activity.options) response = Number.parseInt(raw, 10) - 1;
      else if (activity.pairs) response = raw.trim().split(/[\s,]+/).map((n) => Number.parseInt(n, 10) - 1);
      else response = raw;
    }
  }
  if (response === null || response === undefined) return null;
  const ok = checkActivity(activity, response);
  say(ok ? `Correcto! +${activity.xp} XP` : `Era: ${correctAnswer(activity)}`);
  if (!ok && activity.type === "guided") for (const r of guidedMissing(activity, response)) say(`  Falta: ${r.label}. ${r.hint}`);
  state = record(state, activity, ok, context, day);
  return ok;
}

async function playAll(activities, context) {
  for (const activity of activities) if ((await play(activity, context)) === null) return false;
  return true;
}

async function converse(unit) {
  say(`\n== Role-play: ${unit.roleplay.goal} (escribí 'salir' para terminar) ==`);
  const history = [{ role: "user", content: "Hi! Let's start." }];
  let turns = 0;
  while (turns < MAX_TURNS) {
    let text;
    try {
      text = await reply(unit, history);
    } catch (error) {
      // El último mensaje del alumno sigue en el historial: reintentar no lo pierde.
      say(`\nNo se pudo usar la IA: ${describeError(error)}`);
      const again = await ask("Enter para reintentar, 'salir' para terminar: ");
      if (again === null || again.trim().toLowerCase() === "salir") break;
      continue;
    }
    turns++;
    say(`\nTutor: ${text}`);
    history.push({ role: "assistant", content: text });
    const said = (await ask("Vos: "))?.trim();
    if (!said || said.toLowerCase() === "salir") break;
    history.push({ role: "user", content: said });
  }
  state = completeRoleplay(state, unit.id, turns, day);
}

function showUnitIntro(unit) {
  say(`\n== Unidad ${unit.index + 1}: ${unit.title} (${unit.titleEs}) ==\n${unit.situation}`);
  for (const t of unit.tenses) {
    say(`\nTiempo verbal: ${t.nameEs} (${t.name})`);
    for (const u of t.uses) say(`  Uso: ${u.es}. Ej: ${u.example}`);
    for (const form of ["affirmative", "negative", "interrogative"]) {
      say(`  ${{ affirmative: "Afirmativa", negative: "Negativa", interrogative: "Pregunta" }[form]}: ${t.structures[form][0].pattern}  ->  ${t.structures[form][0].example}`);
    }
  }
}

let open = true;

// 1. Repaso espaciado de lo aprendido en días anteriores.
const reviews = nextReviews(state, curriculum, day, rng, MAX_REVIEWS);
if (reviews.length) {
  say("\n== Repaso ==");
  open = await playAll(reviews, "review");
}

// 2. Lección actual: presentación, práctica rotando los tipos de ejercicio, y ejercicios de unidad.
const lesson = currentLesson(state, curriculum);
if (open && !lesson) say("\nCompletaste todas las unidades disponibles.");
if (open && lesson) {
  const unit = curriculum.unitOf(lesson.unitId);
  if (lesson.id === unit.lessons[0].id && !lesson.itemIds.some((id) => state.items[id])) showUnitIntro(unit);
  say(`\n== Lección: ${lesson.title} ==`);
  if (lesson.itemIds.some((id) => !state.items[id])) {
    for (const id of lesson.itemIds) {
      const item = curriculum.items.get(id);
      say(`  ${item.en}${item.es ? `  =  ${item.es}` : ""}  |  ${item.examples[0]}`);
    }
  }
  for (let round = 0; round < MAX_ROUNDS && open; round++) {
    open = await playAll(lessonActivities(state, curriculum, lesson, rng, { extras: round === 0 }), "learn");
    if (isLessonCleared(state, lesson)) break;
  }
  if (open && isLessonCleared(state, lesson)) {
    say("\nLección superada!");
    if (isUnitCleared(state, unit) && roleplayAvailable(state, unit) && useAi) await converse(unit);
  }
}

saveState(state);

const unlocked = new Set(unlockedLessons(state, curriculum).map((l) => l.id));
say("\n== Tu mapa ==");
for (const unit of curriculum.units) {
  const done = unit.lessons.filter((l) => isLessonCleared(state, l)).length;
  const crowns = unit.lessons.reduce((sum, l) => sum + lessonCrowns(state, l), 0);
  const status = !unit.lessons.some((l) => unlocked.has(l.id)) ? "bloqueada" : done === unit.lessons.length ? "superada" : "en curso";
  say(`  ${unit.index + 1}. ${unit.title}: ${status} (${done}/${unit.lessons.length} lecciones, coronas ${crowns})`);
}
say(`XP: ${state.xp} (+${state.xp - startXp} hoy) | Racha: ${state.streak.days} día(s)`);
if (usage.calls) say(`Tokens de la sesión: ${usage.input} entrada, ${usage.output} salida, ${usage.calls} llamadas.`);
rl.close();

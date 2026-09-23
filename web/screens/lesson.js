// Introducción de la lección, práctica (comprobar -> feedback -> continuar) y resumen.
import { guidedMissing } from "../../src/activities.js";
import { nextReviews } from "../../src/game.js";
import { dayNumber } from "../../src/scheduler.js";
import { h } from "../dom.js";
import { renderExercise } from "../exercises.js";
import { Session } from "../session.js";
import { confirmDialog, ico, mascotBox } from "../ui.js";

const PRAISE = ["¡Muy bien!", "¡Excelente!", "¡Eso es!", "¡Perfecto!", "¡Genial!"];
const FORM_LABEL = { affirmative: "Afirmativa", negative: "Negativa", interrogative: "Pregunta" };

const speakButton = (app, text, cls = "icon-btn") =>
  h("button", { class: cls, type: "button", "aria-label": `Escuchar: ${text}`, disabled: !app.speech.canSpeak, onClick: () => app.speech.speak(text) }, ico("speaker"));

function tenseCard(app, tense) {
  return h(
    "section",
    { class: "card tense-card" },
    h("p", { class: "card-kicker" }, "Tiempo verbal"),
    h("h3", {}, `${tense.nameEs} `, h("small", {}, tense.name)),
    h("ul", { class: "plain-list" }, tense.uses.map((u) => h("li", {}, h("strong", {}, u.es), ": ", h("em", {}, u.example)))),
    h(
      "div",
      { class: "structures" },
      ["affirmative", "negative", "interrogative"].map((form) =>
        h("div", { class: "structure" }, h("span", { class: "chip" }, FORM_LABEL[form]), h("code", {}, tense.structures[form][0].pattern), h("span", { class: "structure-ex" }, tense.structures[form][0].example, speakButton(app, tense.structures[form][0].example))),
      ),
    ),
  );
}

// --- Introducción --------------------------------------------------------------------------------------

export function renderIntro(app, { lessonId }) {
  const { curriculum, state } = app;
  const lesson = curriculum.lessons.find((l) => l.id === lessonId);
  const unit = curriculum.unitOf(lesson.unitId);
  const firstOfUnit = unit.lessons[0].id === lesson.id && !unit.itemList.some((i) => state.items[i.id]);
  const dueCount = nextReviews(state, curriculum, dayNumber(), () => 0.5, 99).length;

  const words = lesson.itemIds.map((id) => {
    const item = curriculum.items.get(id);
    return h("li", { class: "word" }, h("div", { class: "word-main" }, h("strong", {}, item.en), item.es ? h("span", { class: "word-es" }, item.es) : null, h("span", { class: "word-ex" }, item.examples[0])), speakButton(app, item.variants[0]));
  });

  app.root.replaceChildren(
    h("header", { class: "topbar topbar--back" }, h("button", { class: "icon-btn", type: "button", "aria-label": "Volver al camino", onClick: () => app.go("map") }, ico("close")), h("h1", {}, lesson.titleEs)),
    h(
      "main",
      { class: "screen screen--intro" },
      h("div", { class: "intro-hero" }, mascotBox("happy", 96), h("div", {}, h("p", { class: "unit-kicker" }, `Unidad ${unit.index + 1} · ${unit.titleEs}`), h("p", {}, unit.situation))),
      firstOfUnit ? unit.tenses.map((t) => tenseCard(app, t)) : null,
      h("section", { class: "card" }, h("p", { class: "card-kicker" }, "Palabras de esta lección"), h("ul", { class: "words" }, words)),
      dueCount ? h("p", { class: "note" }, `Antes vas a repasar ${Math.min(dueCount, 4)} cosa${dueCount > 1 ? "s" : ""} de días anteriores.`) : null,
    ),
    h("footer", { class: "sticky-cta" }, h("button", { class: "btn btn-primary btn-block", type: "button", onClick: () => app.go("play", { lessonId }) }, "EMPEZAR")),
  );
}

// --- Práctica -------------------------------------------------------------------------------------------

export function renderPlay(app, { lessonId }) {
  const lesson = app.curriculum.lessons.find((l) => l.id === lessonId) ?? null;
  const session = new Session({ state: app.state, curriculum: app.curriculum, day: dayNumber(), lesson });
  app.session = session; // expuesta para depurar desde la consola del navegador
  if (session.finished) return app.go("summary", { summary: session.summary() });

  const fill = h("div", { class: "progress-fill" });
  const main = h("main", { class: "play-main" });
  const footer = h("footer", { class: "checkbar" });
  const close = h("button", { class: "icon-btn", type: "button", "aria-label": "Salir de la lección", onClick: leave }, ico("close"));
  app.root.replaceChildren(h("div", { class: "player" }, h("header", { class: "play-top" }, close, h("div", { class: "progress", role: "progressbar", "aria-label": "Progreso de la lección" }, fill)), main, footer));

  let ex = null;
  let phase = "answer";
  let button = null;

  async function leave() {
    if (await confirmDialog({ title: "¿Salir de la lección?", body: "Tu progreso hasta acá queda guardado.", ok: "Salir", cancel: "Seguir" })) {
      app.speech.stopSpeaking();
      app.go("map");
    }
  }

  function showExercise() {
    phase = "answer";
    app.speech.stopSpeaking();
    ex = renderExercise(session.current, { speech: app.speech, settings: app.settings, change: () => button && (button.disabled = !ex.ready()), complete: (response) => submit(response) });
    const isStory = session.current.type === "story";
    main.replaceChildren(h("div", { class: "ex-enter" }, ex.el));
    footer.className = "checkbar";
    button = isStory ? null : h("button", { class: "btn btn-primary btn-block", type: "button", disabled: true, onClick: () => submit(ex.getResponse()) }, "COMPROBAR");
    footer.replaceChildren(...(button ? [button] : [h("p", { class: "checkbar-hint" }, "Elegí tus respuestas para seguir la historia.")]));
    fill.style.width = `${Math.round(session.progress * 100)}%`;
  }

  function submit(response) {
    if (phase !== "answer") return;
    const result = session.submit(response);
    app.state = session.state;
    app.saveState();
    phase = "feedback";
    // La barra avanza apenas se responde (lo que falta ya no incluye este ejercicio).
    fill.style.width = `${Math.round((session.answered / (session.answered + session.queue.length - 1)) * 100)}%`;
    ex.reveal(result);
    showFeedback(result);
  }

  function showFeedback(result) {
    const a = result.activity;
    let heading;
    let detail = null;
    if (result.ok) {
      heading = PRAISE[session.answered % PRAISE.length];
      detail = `+${result.xp} XP`;
    } else if (a.type === "story") {
      heading = "Casi. Fijate las respuestas marcadas.";
    } else if (a.type === "guided") {
      heading = "Te faltó incluir:";
      detail = [...guidedMissing(a, result.response).map((r) => `• ${r.label}: ${r.hint}`), `Ejemplo: ${a.sample}`].join("\n");
    } else {
      heading = "Respuesta correcta:";
      detail = result.answer;
    }
    const english = !result.ok && (a.target?.en ?? (["order", "transform"].includes(a.type) ? a.answer : null));
    button = h("button", { class: `btn ${result.ok ? "btn-primary" : "btn-danger"} btn-block`, type: "button", onClick: advance }, "CONTINUAR");
    footer.className = `checkbar ${result.ok ? "ok" : "bad"}`;
    footer.replaceChildren(
      h("div", { class: "check-body" }, mascotBox(result.ok ? "cheer" : "sad", 56, "check-mascot"), h("div", { class: "check-text" }, h("strong", {}, heading), detail ? h("p", { class: "check-detail" }, detail) : null), english ? speakButton(app, english) : null),
      button,
    );
    button.focus();
  }

  function advance() {
    if (phase !== "feedback") return;
    session.next();
    if (session.finished) {
      fill.style.width = "100%";
      cleanup();
      return app.go("summary", { summary: session.summary() });
    }
    showExercise();
  }

  const onKey = (event) => {
    const typing = ["INPUT", "TEXTAREA"].includes(event.target.tagName);
    if (event.key === "Enter" && !(event.target.tagName === "TEXTAREA" && event.shiftKey)) {
      if (phase === "answer" && ex.ready()) {
        event.preventDefault();
        submit(ex.getResponse());
      } else if (phase === "feedback") {
        event.preventDefault();
        advance();
      }
    } else if (!typing && phase === "answer" && /^[1-9]$/.test(event.key)) {
      ex.chooseByKey?.(Number(event.key));
    }
  };
  const cleanup = () => document.removeEventListener("keydown", onKey);
  document.addEventListener("keydown", onKey);
  app.onLeave(cleanup);

  showExercise();
}

// --- Resumen ---------------------------------------------------------------------------------------------

export function renderSummary(app, { summary }) {
  const { lesson, cleared } = summary;
  const title = !lesson ? "¡Repaso listo!" : cleared ? "¡Lección superada!" : "¡Buen trabajo!";
  const sub = !lesson ? "Ya recorriste todo el contenido disponible." : cleared ? "Se desbloqueó la siguiente lección." : "Todavía no llegaste al 80%: volvé a intentarlo y la superás.";
  const xp = h("strong", { class: "count-up" }, "0");
  const card = (label, value, tone) => h("div", { class: `summary-card tone-${tone}` }, h("span", { class: "summary-label" }, label), h("span", { class: "summary-value" }, value));

  app.root.replaceChildren(
    h(
      "main",
      { class: "screen screen--summary" },
      mascotBox(cleared || !lesson ? "cheer" : "happy", 190, "summary-mascot"),
      h("h1", {}, title),
      h("p", { class: "summary-sub" }, sub),
      h("div", { class: "summary-cards" }, card("XP ganada", xp, 0), card("Precisión", `${summary.accuracy}%`, 1), card("Racha", `${summary.streak} día${summary.streak === 1 ? "" : "s"}`, 2)),
      summary.roleplay ? h("button", { class: "btn btn-secondary btn-block", type: "button", onClick: () => app.go("roleplay", { unitId: summary.unit.id }) }, "Desafío: role-play con IA") : null,
      h("button", { class: "btn btn-primary btn-block", type: "button", onClick: () => app.go("map") }, "CONTINUAR"),
    ),
  );

  // La XP sube de a poco hasta el valor final.
  const target = summary.xp;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / 900);
    xp.textContent = `+${Math.round(target * t)}`;
    if (t < 1 && xp.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

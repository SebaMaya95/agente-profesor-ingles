// Cómo se ve y se contesta cada tipo de ejercicio. Cada renderizador devuelve:
//   { el, getResponse(), ready(), reveal(resultado), chooseByKey?(n) }
// ctx: { speech, settings, change() (avisa que cambió si está listo), complete(respuesta) (solo historias) }
import { guidedMatches, storyStep } from "../src/activities.js";
import { h, wait } from "./dom.js";
import { icon } from "./icons.js";

const ico = (name) => h("span", { class: "ico", html: icon(name) });

function audioButton(text, ctx, label = "Escuchar") {
  const button = h("button", { class: "audio-btn", type: "button", "aria-label": label, onClick: () => ctx.speech.speak(text) }, ico("speaker"), h("span", {}, label));
  if (!ctx.speech.canSpeak) {
    button.disabled = true;
    button.title = "Tu navegador no tiene voz";
  }
  return button;
}

const autoSpeak = (text, ctx) => {
  if (ctx.settings.voice && ctx.speech.canSpeak) setTimeout(() => ctx.speech.speak(text), 350);
};

const title = (a) => h("h2", { class: "ex-title" }, a.prompt);
const hint = (a) => (a.hint ? h("p", { class: "ex-hint" }, `Pista: ${a.hint}`) : null);

const sentence = (text) => {
  const parts = text.split("___");
  return h("p", { class: "sentence" }, parts.flatMap((part, i) => (i < parts.length - 1 ? [part, h("span", { class: "blank" })] : [part])));
};

const dialogue = (turns) =>
  h("div", { class: "dialogue" }, turns.map((t) => h("div", { class: `bubble bubble--${t.who === "A" ? "left" : "right"}${t.text == null ? " bubble--gap" : ""}` }, t.text ?? "…")));

// --- Elegir una opción: escuchar, completar, detectar el error, completar el diálogo -------------

function renderChoice(a, ctx) {
  let chosen = null;
  const buttons = a.options.map((text, i) =>
    h("button", { class: "choice", type: "button", onClick: () => select(i) }, h("span", { class: "choice-key" }, String(i + 1)), h("span", { class: "choice-text" }, text)),
  );
  function select(i) {
    if (buttons[0].disabled) return;
    chosen = i;
    buttons.forEach((b, j) => b.classList.toggle("is-selected", j === i));
    ctx.change();
  }
  if (a.type === "listen-choose") autoSpeak(a.say, ctx);
  const el = h("div", { class: "ex" }, title(a), hint(a), a.say ? audioButton(a.say, ctx) : null, a.text ? sentence(a.text) : null, a.turns ? dialogue(a.turns) : null, h("div", { class: "choices" }, buttons));
  return {
    el,
    getResponse: () => chosen,
    ready: () => chosen !== null,
    chooseByKey: (n) => n >= 1 && n <= buttons.length && select(n - 1),
    reveal() {
      buttons.forEach((b, i) => {
        b.disabled = true;
        b.classList.remove("is-selected");
        if (i === a.correctIndex) b.classList.add("is-right");
        else if (i === chosen) b.classList.add("is-wrong");
      });
    },
  };
}

// --- Relacionar: tocar un elemento de la izquierda y luego su par de la derecha --------------------

function renderMatch(a, ctx) {
  const pairs = a.pairs.map(() => null); // índice izquierdo -> índice derecho
  let selected = 0;
  const lefts = a.pairs.map((p, i) => h("button", { class: "match-item", type: "button", onClick: () => pickLeft(i) }, h("span", { class: "match-key" }, String.fromCharCode(65 + i)), p.left));
  const rights = a.rights.map((r, j) => h("button", { class: "match-item", type: "button", onClick: () => pickRight(j) }, r));
  const locked = () => lefts[0].disabled;

  function pickLeft(i) {
    if (locked()) return;
    if (pairs[i] !== null) pairs[i] = null; // tocar un par armado lo deshace
    selected = i;
    paint();
  }
  function pickRight(j) {
    if (locked()) return;
    pairs.forEach((v, i) => v === j && (pairs[i] = null));
    pairs[selected] = j;
    const next = pairs.findIndex((v) => v === null);
    selected = next === -1 ? selected : next;
    paint();
  }
  function paint() {
    lefts.forEach((b, i) => {
      b.className = `match-item${pairs[i] !== null ? ` pair-${i % 4}` : ""}${selected === i && pairs[i] === null ? " is-selected" : ""}`;
    });
    rights.forEach((b, j) => {
      const owner = pairs.indexOf(j);
      b.className = `match-item${owner !== -1 ? ` pair-${owner % 4}` : ""}`;
    });
    ctx.change();
  }
  paint();

  return {
    el: h("div", { class: "ex" }, title(a), h("p", { class: "ex-hint" }, "Tocá una palabra y después su significado."), h("div", { class: "match" }, h("div", { class: "match-col" }, lefts), h("div", { class: "match-col" }, rights))),
    getResponse: () => [...pairs],
    ready: () => pairs.every((v) => v !== null),
    reveal() {
      const verdict = (i) => (pairs[i] === a.answer[i] ? "is-right" : "is-wrong");
      lefts.forEach((b, i) => {
        b.disabled = true;
        b.className = `match-item ${verdict(i)}`;
      });
      rights.forEach((b, j) => {
        b.disabled = true;
        const owner = pairs.indexOf(j);
        b.className = `match-item ${owner === -1 ? "" : verdict(owner)}`;
      });
    },
  };
}

// --- Armar la frase con las palabras desordenadas ---------------------------------------------------

function renderOrder(a, ctx) {
  const placed = []; // índices de a.words en el orden elegido
  const answer = h("div", { class: "order-answer", "aria-label": "Tu frase" });
  const bank = h("div", { class: "order-bank" });
  let done = false;

  function paint() {
    answer.replaceChildren(...placed.map((i) => h("button", { class: "tile", type: "button", onClick: () => !done && (placed.splice(placed.indexOf(i), 1), paint()) }, a.words[i])));
    bank.replaceChildren(...a.words.map((w, i) => (placed.includes(i) ? h("span", { class: "tile tile--ghost" }, w) : h("button", { class: "tile", type: "button", onClick: () => !done && (placed.push(i), paint()) }, w))));
    ctx.change();
  }
  paint();

  return {
    el: h("div", { class: "ex" }, title(a), hint(a), answer, bank),
    getResponse: () => placed.map((i) => a.words[i]),
    ready: () => placed.length === a.words.length,
    reveal({ ok }) {
      done = true;
      answer.classList.add(ok ? "is-right" : "is-wrong");
      answer.querySelectorAll("button").forEach((b) => (b.disabled = true));
    },
  };
}

// --- Decir o escribir: hablar, repetir, corregir, diálogo, transformar, consigna guiada --------------

function renderText(a, ctx) {
  const guided = a.type === "guided";
  const input = h(guided ? "textarea" : "input", {
    class: "text-input",
    rows: guided ? 4 : null,
    type: guided ? null : "text",
    placeholder: "Escribí o usá el micrófono…",
    autocomplete: "off",
    autocapitalize: "off",
    spellcheck: "false",
    enterkeyhint: "done",
    "aria-label": "Tu respuesta",
  });
  const status = h("span", { class: "mic-status", role: "status" });
  let listening = null;

  const chips = guided ? a.requirements.map((r) => h("li", { class: "req" }, h("span", { class: "req-dot" }), r.label)) : [];
  const refreshChips = () => {
    if (!guided) return;
    const done = new Set(guidedMatches(a, input.value));
    a.requirements.forEach((r, i) => chips[i].classList.toggle("on", done.has(r)));
  };
  input.addEventListener("input", () => {
    refreshChips();
    ctx.change();
  });

  const stopMic = () => {
    listening?.stop();
    listening = null;
    mic?.classList.remove("is-live");
    status.textContent = "";
  };
  const toggleMic = () => {
    if (listening) return stopMic();
    ctx.speech.stopSpeaking();
    mic.classList.add("is-live");
    status.textContent = "Escuchando… hablá en inglés";
    listening = ctx.speech.listen({
      onText: (text) => {
        input.value = text;
        input.dispatchEvent(new Event("input"));
      },
      onEnd: () => {
        listening = null;
        mic.classList.remove("is-live");
        status.textContent = input.value ? "" : "No te escuché. Probá de nuevo.";
      },
      onError: (code) => {
        status.textContent = code === "not-allowed" ? "Permití el micrófono en el navegador, o escribí la respuesta." : code === "no-speech" ? "No te escuché. Probá de nuevo." : "No se pudo usar el micrófono: escribí la respuesta.";
      },
    });
  };
  const mic = ctx.speech.canListen && ctx.settings.mic ? h("button", { class: "mic", type: "button", "aria-label": "Hablar", onClick: toggleMic }, ico("mic")) : null;

  if (a.type === "shadow") autoSpeak(a.say, ctx);
  const el = h(
    "div",
    { class: "ex" },
    title(a),
    a.type === "shadow" ? h("div", { class: "shadow-box" }, audioButton(a.say, ctx), h("p", { class: "shadow-text" }, a.say)) : null,
    a.source ? h("div", { class: "card-quote" }, a.source) : null,
    a.text ? h("div", { class: "card-quote card-quote--wrong" }, a.text) : null,
    a.turns ? dialogue(a.turns) : null,
    guided ? h("ul", { class: "reqs" }, chips) : null,
    h("div", { class: "text-row" }, input, mic),
    status,
  );
  setTimeout(() => !mic && input.focus(), 50);
  return {
    el,
    getResponse: () => input.value.trim(),
    ready: () => input.value.trim().length > 0,
    reveal({ ok }) {
      stopMic();
      input.disabled = true;
      input.classList.add(ok ? "is-right" : "is-wrong");
      mic && (mic.disabled = true);
    },
  };
}

// --- Historia con opciones ---------------------------------------------------------------------------

function renderStory(a, ctx) {
  const { story } = a;
  const goods = [];
  const log = h("div", { class: "story-log" });
  const options = h("div", { class: "choices" });

  function say(who, text, cls = "") {
    const bubble = h("div", { class: `bubble bubble--${who} ${cls}` }, text);
    log.append(bubble);
    bubble.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
    return bubble;
  }
  function show(nodeId) {
    const node = story.nodes[nodeId];
    say("left", node.npc);
    if (ctx.settings.voice) ctx.speech.speak(node.npc);
    if (node.end) return wait(700).then(() => ctx.complete([...goods]));
    options.replaceChildren(
      ...node.options.map((o, i) =>
        h("button", { class: "choice", type: "button", onClick: () => choose(nodeId, i) }, h("span", { class: "choice-key" }, String(i + 1)), h("span", { class: "choice-text" }, o.text)),
      ),
    );
    return null;
  }
  async function choose(nodeId, i) {
    const step = storyStep(story, nodeId, i);
    options.replaceChildren();
    goods.push(step.good);
    say("right", story.nodes[nodeId].options[i].text, step.good ? "is-right" : "is-wrong");
    if (!step.good) say("left", `Mejor: ${step.best}`, "bubble--tip");
    await wait(step.good ? 500 : 1400);
    show(step.next);
  }
  show(story.start);

  return {
    el: h("div", { class: "ex" }, title(a), log, options),
    getResponse: () => goods,
    ready: () => false,
    reveal() {},
  };
}

export function renderExercise(a, ctx) {
  if (a.options) return renderChoice(a, ctx);
  if (a.type === "match") return renderMatch(a, ctx);
  if (a.type === "order") return renderOrder(a, ctx);
  if (a.type === "story") return renderStory(a, ctx);
  return renderText(a, ctx);
}

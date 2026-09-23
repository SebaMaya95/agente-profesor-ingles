// Role-play con IA: la única pantalla que llama al servidor (/api/roleplay). Máximo 4 turnos.
import { ROLEPLAY_MIN_TURNS, completeRoleplay } from "../../src/game.js";
import { dayNumber } from "../../src/scheduler.js";
import { h } from "../dom.js";
import { ico, mascotBox } from "../ui.js";

const MAX_TURNS = 4;

const ERRORS = {
  not_configured: "El role-play todavía no está configurado en este servidor (falta la API key o el código de acceso).",
  bad_code: "El código de acceso es incorrecto. Revisalo en Perfil.",
  rate_limited: "Hiciste muchos pedidos seguidos. Esperá unos minutos.",
  bad_request: "No se pudo enviar el mensaje. Probá de nuevo.",
  model_error: "La IA no respondió. Probá de nuevo en un momento.",
  network: "No hay conexión con el servidor.",
};

export function renderRoleplay(app, { unitId }) {
  const unit = app.curriculum.units.find((u) => u.id === unitId);
  const history = [{ role: "user", content: "Hi! Let's start." }]; // primer mensaje fijo: el tutor abre la escena
  let turns = 0;
  let busy = false;
  let finished = false;

  const log = h("div", { class: "chat-log", "aria-live": "polite" });
  const input = h("input", { class: "text-input", type: "text", placeholder: "Escribí o hablá en inglés…", autocomplete: "off", autocapitalize: "off", spellcheck: "false", "aria-label": "Tu mensaje" });
  const status = h("span", { class: "mic-status", role: "status" });
  const finish = h("button", { class: "btn btn-ghost", type: "button", onClick: () => end() }, "Terminar");
  let listening = null;

  const bubble = (side, text, cls = "") => {
    const el = h("div", { class: `bubble bubble--${side} ${cls}` }, text);
    log.append(el);
    el.scrollIntoView?.({ block: "end", behavior: "smooth" });
    return el;
  };

  async function fetchReply() {
    let response;
    try {
      response = await fetch("/api/roleplay", { method: "POST", headers: { "content-type": "application/json", "x-access-code": app.settings.accessCode }, body: JSON.stringify({ unitId, messages: history }) });
    } catch {
      throw Object.assign(new Error("network"), { code: "network" });
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw Object.assign(new Error("api"), { code: body.error ?? "model_error" });
    }
    return (await response.json()).text;
  }

  async function tutorTurn() {
    busy = true;
    const typing = bubble("left", "…", "bubble--typing");
    try {
      const text = await fetchReply();
      typing.remove();
      history.push({ role: "assistant", content: text });
      bubble("left", text);
      turns += 1;
      if (app.settings.voice) app.speech.speak(text);
    } catch (error) {
      typing.remove();
      const notice = bubble("left", ERRORS[error.code] ?? ERRORS.model_error, "bubble--tip");
      const retry = h("button", { class: "btn btn-secondary", type: "button", onClick: () => (notice.remove(), retry.remove(), tutorTurn()) }, "Reintentar");
      log.append(retry);
      if (["bad_code", "not_configured"].includes(error.code)) retry.textContent = "Ir a Perfil", (retry.onclick = () => app.go("settings"));
    }
    busy = false;
  }

  function send() {
    const text = input.value.trim();
    if (!text || busy || finished) return;
    listening?.stop();
    input.value = "";
    history.push({ role: "user", content: text });
    bubble("right", text);
    if (turns >= MAX_TURNS) end();
    else tutorTurn();
  }

  function end() {
    if (finished) return;
    finished = true;
    listening?.stop();
    app.speech.stopSpeaking();
    const before = app.state.xp;
    app.state = completeRoleplay(app.state, unit.id, turns, dayNumber());
    app.saveState();
    const gained = app.state.xp - before;
    const card = h(
        "div",
        { class: "chat-end" },
        mascotBox(gained ? "cheer" : "happy", 120),
        h("h2", {}, gained ? "¡Role-play completado!" : turns >= ROLEPLAY_MIN_TURNS ? "¡Buen trabajo!" : "Hasta acá llegamos"),
        h("p", {}, gained ? `+${gained} XP` : turns >= ROLEPLAY_MIN_TURNS ? "Ya habías completado este desafío." : `Con ${ROLEPLAY_MIN_TURNS} intercambios o más ganás XP.`),
        h("button", { class: "btn btn-primary btn-block", type: "button", onClick: () => app.go("map") }, "CONTINUAR"),
    );
    log.append(card);
    card.scrollIntoView?.({ block: "end", behavior: "smooth" });
    input.disabled = true;
    finish.disabled = true;
  }

  const mic = app.speech.canListen && app.settings.mic
    ? h("button", { class: "mic", type: "button", "aria-label": "Hablar", onClick: () => {
        if (listening) return listening.stop();
        app.speech.stopSpeaking();
        mic.classList.add("is-live");
        status.textContent = "Escuchando…";
        listening = app.speech.listen({
          onText: (text) => (input.value = text),
          onEnd: () => ((listening = null), mic.classList.remove("is-live"), (status.textContent = "")),
          onError: () => (status.textContent = "No se pudo usar el micrófono: escribí el mensaje."),
        });
      } }, ico("mic"))
    : null;

  input.addEventListener("keydown", (event) => event.key === "Enter" && (event.preventDefault(), send()));

  app.root.replaceChildren(
    h(
      "div",
      { class: "chat" },
      h("header", { class: "play-top" }, h("button", { class: "icon-btn", type: "button", "aria-label": "Salir", onClick: () => (app.speech.stopSpeaking(), app.go("map")) }, ico("close")), h("div", { class: "chat-title" }, h("strong", {}, "Role-play"), h("span", {}, unit.roleplay.goal))),
      log,
      h("footer", { class: "chat-input" }, status, h("div", { class: "text-row" }, input, mic, h("button", { class: "btn btn-primary btn-send", type: "button", "aria-label": "Enviar", onClick: send }, ico("send"))), finish),
    ),
  );
  tutorTurn();
}

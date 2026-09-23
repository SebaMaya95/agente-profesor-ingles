// Arranque de la web: carga el contenido, arma el curso con el perfil del alumno y navega entre pantallas.
import { buildCurriculum } from "../src/curriculum.js";
import { newState } from "../src/game.js";
import { h } from "./dom.js";
import { renderMap } from "./screens/map.js";
import { renderIntro, renderPlay, renderSummary } from "./screens/lesson.js";
import { renderRoleplay } from "./screens/roleplay.js";
import { renderSettings } from "./screens/settings.js";
import { createSpeech } from "./speech.js";
import { createStorage } from "./storage.js";
import { mascotBox } from "./ui.js";

const FILES = {
  vocabulario: "/data/contenido/vocabulario.json",
  tiempos: "/data/contenido/tiempos.json",
  unidades: "/data/contenido/unidades.json",
  actividades: "/data/contenido/actividades.json",
  perfil: "/data/perfil.ejemplo.json",
};

const SCREENS = { map: renderMap, intro: renderIntro, play: renderPlay, summary: renderSummary, roleplay: renderRoleplay, settings: renderSettings };

async function loadAll() {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, url]) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${url}: ${response.status}`);
      return [key, await response.json()];
    }),
  );
  return Object.fromEntries(entries);
}

function showMessage(root, mood, title, body, action) {
  root.replaceChildren(h("main", { class: "screen screen--message" }, mascotBox(mood, 140), h("h1", {}, title), body ? h("p", {}, body) : null, action ?? null));
}

async function boot() {
  const root = document.getElementById("app");
  showMessage(root, "think", "Cargando…");
  let data;
  try {
    data = await loadAll();
  } catch {
    return showMessage(root, "sad", "No se pudo cargar el curso", "Revisá tu conexión e intentá de nuevo.", h("button", { class: "btn btn-primary", type: "button", onClick: boot }, "REINTENTAR"));
  }

  const { perfil, ...content } = data;
  const { nota, ...defaults } = perfil;
  const storage = createStorage();
  const app = {
    root,
    content,
    defaults,
    storage,
    speech: createSpeech(),
    settings: storage.loadSettings(),
    profile: storage.loadProfile(defaults),
    state: storage.loadState(),
    curriculum: null,
    hooks: [],
    onLeave(fn) {
      this.hooks.push(fn);
    },
    saveState() {
      storage.saveState(this.state);
    },
    resetProgress() {
      storage.resetState();
      this.state = newState();
    },
    setProfile(profile) {
      this.profile = profile;
      storage.saveProfile(profile);
      this.curriculum = buildCurriculum(content, profile);
    },
    setSettings(patch) {
      this.settings = { ...this.settings, ...patch };
      storage.saveSettings(this.settings);
    },
    go(screen, params = {}) {
      this.hooks.splice(0).forEach((fn) => fn());
      window.scrollTo(0, 0);
      SCREENS[screen](this, params);
    },
  };
  app.curriculum = buildCurriculum(content, app.profile);
  window.__app = app; // para depurar desde la consola del navegador
  app.go("map");
}

boot();

// Service worker (instalable / uso sin conexión). Solo fuera de localhost para no confundir el desarrollo.
if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("/sw.js").catch(() => {});

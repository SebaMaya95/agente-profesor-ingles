// Piezas de interfaz compartidas entre pantallas.
import { lessonCrowns } from "../src/game.js";
import { h } from "./dom.js";
import { icon } from "./icons.js";
import { mascot } from "./mascot.js";

export const ico = (name, cls = "ico") => h("span", { class: cls, html: icon(name) });
export const mascotBox = (mood, size, cls = "") => h("span", { class: `mascot-box ${cls}`, html: mascot(mood, size) });

export function totalCrowns(app) {
  return app.curriculum.lessons.reduce((sum, l) => sum + lessonCrowns(app.state, l), 0);
}

// Racha, XP y coronas.
export function stats(app) {
  const stat = (name, value, label, tone) =>
    h("div", { class: `stat stat--${tone}`, title: label }, ico(name), h("span", { class: "stat-value" }, String(value)), h("span", { class: "sr-only" }, label));
  return h("div", { class: "stats" }, stat("flame", app.state.streak.days, "días de racha", "flame"), stat("star", app.state.xp, "XP", "xp"), stat("crown", totalCrowns(app), "coronas", "crown"));
}

export function bottomNav(app, active) {
  const item = (id, name, label) =>
    h("button", { class: `nav-item${active === id ? " is-active" : ""}`, type: "button", "aria-current": active === id ? "page" : null, onClick: () => app.go(id) }, ico(name), h("span", {}, label));
  return h("nav", { class: "bottom-nav", "aria-label": "Principal" }, item("map", "path", "Camino"), item("settings", "user", "Perfil"));
}

export function toast(text) {
  const el = h("div", { class: "toast", role: "status" }, text);
  document.body.append(el);
  setTimeout(() => el.classList.add("is-out"), 2200);
  setTimeout(() => el.remove(), 2600);
}

// Diálogo de confirmación. Devuelve una promesa con true (aceptó) o false.
export function confirmDialog({ title, body, ok = "Sí", cancel = "Cancelar", danger = false }) {
  return new Promise((resolve) => {
    const close = (value) => {
      overlay.remove();
      resolve(value);
    };
    const overlay = h(
      "div",
      { class: "overlay", role: "dialog", "aria-modal": "true", "aria-label": title },
      h(
        "div",
        { class: "dialog" },
        mascotBox("think", 96),
        h("h2", {}, title),
        h("p", {}, body),
        h("button", { class: `btn ${danger ? "btn-danger" : "btn-primary"}`, type: "button", onClick: () => close(true) }, ok),
        h("button", { class: "btn btn-ghost", type: "button", onClick: () => close(false) }, cancel),
      ),
    );
    document.body.append(overlay);
    overlay.querySelector(".btn")?.focus();
  });
}

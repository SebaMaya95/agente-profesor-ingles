// Perfil, voz, código del role-play y reinicio de progreso.
import { h } from "../dom.js";
import { bottomNav, confirmDialog, mascotBox, toast } from "../ui.js";

const PROFILE_FIELDS = [
  ["name", "Tu nombre", "Sam"],
  ["age", "Tu edad", "30"],
  ["nationality", "Nacionalidad (en inglés)", "Argentine"],
  ["hometown", "De dónde sos", "Buenos Aires, Argentina"],
  ["birthday", "Cumpleaños (en inglés)", "March 3"],
  ["height", "Altura (en inglés)", "1.75 meters"],
  ["weight", "Peso (en inglés)", "70 kilograms"],
  ["hair", "Color de pelo (en inglés)", "dark"],
  ["eyes", "Color de ojos (en inglés)", "brown"],
  ["home", "Dónde vivís (en inglés)", "in an apartment"],
  ["father", "Papá", "Tom"],
  ["mother", "Mamá", "Anna"],
  ["brother", "Hermano", "Max"],
  ["sister", "Hermana", "Lucy"],
  ["grandmother", "Abuela", "Rose"],
  ["godson", "Ahijado", "Leo"],
  ["goddaughter", "Ahijada", "Mia"],
  ["pet1", "Mascota 1", "Rocky"],
  ["pet2", "Mascota 2", "Luna"],
];

export function renderSettings(app) {
  const inputs = Object.fromEntries(
    PROFILE_FIELDS.map(([key, , example]) => [key, h("input", { class: "text-input", type: "text", value: app.profile[key] ?? "", placeholder: example, autocomplete: "off", "aria-label": key })]),
  );
  const toggle = (label, checked, onChange) => {
    const box = h("input", { type: "checkbox", checked: checked ? "checked" : null });
    box.checked = checked;
    box.addEventListener("change", () => onChange(box.checked));
    return h("label", { class: "toggle" }, h("span", {}, label), box, h("span", { class: "toggle-track" }));
  };
  const code = h("input", { class: "text-input", type: "password", value: app.settings.accessCode, placeholder: "Código de acceso", autocomplete: "off", "aria-label": "Código de acceso del role-play" });

  const saveProfile = () => {
    const values = {};
    for (const [key] of PROFILE_FIELDS) values[key] = inputs[key].value.trim() || app.defaults[key];
    app.setProfile(values);
    toast("Perfil guardado");
  };

  app.root.replaceChildren(
    h("header", { class: "topbar" }, h("div", { class: "brand" }, mascotBox("happy", 40), h("span", {}, "Perfil"))),
    h(
      "main",
      { class: "screen screen--settings" },
      h("section", { class: "card" }, h("h2", {}, "Tus datos"), h("p", { class: "note" }, "Las frases del curso hablan de vos. Se guardan solo en este navegador: no se envían a ningún servidor."), h("div", { class: "fields" }, PROFILE_FIELDS.map(([key, label]) => h("label", { class: "field" }, h("span", {}, label), inputs[key]))), h("button", { class: "btn btn-primary btn-block", type: "button", onClick: saveProfile }, "GUARDAR")),
      h(
        "section",
        { class: "card" },
        h("h2", {}, "Voz"),
        toggle("Escuchar el inglés en voz alta", app.settings.voice, (v) => app.setSettings({ voice: v })),
        toggle("Usar el micrófono para hablar", app.settings.mic, (v) => app.setSettings({ mic: v })),
        h("p", { class: "note" }, app.speech.canListen ? "Tu navegador reconoce voz: podés contestar hablando." : "Tu navegador no reconoce voz (probá Chrome, Edge o Safari): vas a contestar escribiendo."),
        h("p", { class: "note" }, "El reconocimiento de voz lo hace tu navegador: por lo general envía el audio a su proveedor (Google en Chrome, Apple en Safari). Esta app nunca recibe tu audio."),
      ),
      h(
        "section",
        { class: "card" },
        h("h2", {}, "Role-play con IA"),
        h("p", { class: "note" }, "Es el único ejercicio que usa IA. Pedile el código de acceso a quien administra la app."),
        code,
        h("button", { class: "btn btn-secondary btn-block", type: "button", onClick: () => (app.setSettings({ accessCode: code.value.trim() }), toast("Código guardado")) }, "GUARDAR CÓDIGO"),
      ),
      h(
        "section",
        { class: "card" },
        h("h2", {}, "Progreso"),
        h("p", { class: "note" }, `Tenés ${app.state.xp} XP y una racha de ${app.state.streak.days} día(s).`),
        h(
          "button",
          {
            class: "btn btn-danger btn-block",
            type: "button",
            onClick: async () => {
              if (await confirmDialog({ title: "¿Borrar todo tu progreso?", body: "Vas a empezar de cero. No se puede deshacer.", ok: "Borrar", cancel: "Cancelar", danger: true })) {
                app.resetProgress();
                app.go("map");
              }
            },
          },
          "BORRAR PROGRESO",
        ),
      ),
    ),
    bottomNav(app, "settings"),
  );
}

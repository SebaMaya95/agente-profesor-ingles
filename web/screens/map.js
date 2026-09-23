// Pantalla principal: el camino de unidades y lecciones.
import { currentLesson, isLessonCleared, isUnitCleared, lessonCrowns, roleplayAvailable, unlockedLessons } from "../../src/game.js";
import { h } from "../dom.js";
import { bottomNav, ico, mascotBox, stats, toast } from "../ui.js";

const OFFSETS = [0, 38, 62, 38, 0, -38, -62, -38]; // zigzag del camino

export function renderMap(app) {
  const { curriculum, state } = app;
  const current = currentLesson(state, curriculum);
  const unlocked = new Set(unlockedLessons(state, curriculum).map((l) => l.id));
  let step = 0;
  let currentNode = null;

  const map = h("div", { class: "map" });
  for (const unit of curriculum.units) {
    const open = unit.lessons.some((l) => unlocked.has(l.id));
    map.append(
      h(
        "section",
        { class: `unit-banner tone-${unit.index % 4}${open ? "" : " is-locked"}` },
        h("div", {}, h("p", { class: "unit-kicker" }, `Unidad ${unit.index + 1}`), h("h2", {}, unit.titleEs), h("p", { class: "unit-tense" }, unit.tenses.map((t) => t.nameEs).join(" · "))),
        h("span", { class: "unit-badge" }, `${unit.lessons.filter((l) => isLessonCleared(state, l)).length}/${unit.lessons.length}`),
      ),
    );

    const trail = h("div", { class: "trail" });
    for (const lesson of unit.lessons) {
      const cleared = isLessonCleared(state, lesson);
      const isCurrent = current?.id === lesson.id;
      const status = cleared ? "done" : isCurrent ? "current" : "locked";
      const crowns = lessonCrowns(state, lesson);
      const node = h(
        "button",
        {
          class: `node node--${status}`,
          type: "button",
          style: `--off:${OFFSETS[step % OFFSETS.length]}px`,
          "aria-label": `${lesson.titleEs}: ${status === "done" ? "superada" : status === "current" ? "actual" : "bloqueada"}`,
          onClick: () => (status === "locked" ? toast("Superá la lección anterior para desbloquear esta.") : app.go("intro", { lessonId: lesson.id })),
        },
        ico(status === "done" ? "check" : status === "current" ? "play" : "lock"),
        cleared ? h("span", { class: "node-crowns" }, [1, 2, 3].map((n) => h("span", { class: `crown${n <= crowns ? " on" : ""}` }, ico("crown")))) : null,
      );
      const wrap = h("div", { class: `node-wrap${isCurrent ? " node-wrap--current" : ""}`, style: `--off:${OFFSETS[step % OFFSETS.length]}px` }, node, isCurrent ? h("span", { class: "start-tip" }, "EMPEZAR") : null, isCurrent ? mascotBox("happy", 84, "node-mascot") : null);
      if (isCurrent) currentNode = wrap;
      trail.append(wrap);
      step += 1;
    }

    // Desafío final de la unidad: role-play con IA.
    const cleared = isUnitCleared(state, unit);
    const ready = roleplayAvailable(state, unit);
    const done = cleared && !ready;
    const status = done ? "done" : ready ? "ready" : "locked";
    trail.append(
      h(
        "div",
        { class: "node-wrap", style: `--off:${OFFSETS[step % OFFSETS.length]}px` },
        h(
          "button",
          {
            class: `node node--boss node--${status}`,
            type: "button",
            "aria-label": `Role-play de la unidad ${unit.index + 1}`,
            onClick: () => (cleared ? app.go("roleplay", { unitId: unit.id }) : toast("Superá todas las lecciones de la unidad para el role-play.")),
          },
          ico(cleared ? "chat" : "lock"),
        ),
        h("span", { class: "boss-label" }, "Role-play"),
      ),
    );
    step += 1;
    map.append(trail);
  }

  app.root.replaceChildren(
    h("header", { class: "topbar" }, h("div", { class: "brand" }, mascotBox("happy", 40), h("span", {}, "Colly")), stats(app)),
    h("main", { class: "screen screen--map" }, map),
    bottomNav(app, "map"),
  );
  currentNode?.scrollIntoView({ block: "center" });
}

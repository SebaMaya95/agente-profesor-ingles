import { test } from "node:test";
import assert from "node:assert/strict";
import { INTERVALS_DAYS, dueItems, interleave, newItem, review } from "../src/scheduler.js";

test("un ítem nuevo vence al primer intervalo", () => {
  assert.equal(newItem("a", "L1", 100).due, 100 + INTERVALS_DAYS[0]);
});

test("acierto sube de nivel y alarga el intervalo", () => {
  const it = review(newItem("a", "L1", 100), true, 101);
  assert.equal(it.level, 1);
  assert.equal(it.due, 101 + INTERVALS_DAYS[1]);
});

test("el nivel no supera el último intervalo", () => {
  let it = newItem("a", "L1", 0);
  for (let i = 0; i < 10; i++) it = review(it, true, 0);
  assert.equal(it.level, INTERVALS_DAYS.length - 1);
});

test("error vuelve al primer intervalo", () => {
  const it = review({ id: "a", lesson: "L1", level: 3, due: 5 }, false, 20);
  assert.equal(it.level, 0);
  assert.equal(it.due, 20 + INTERVALS_DAYS[0]);
});

test("dueItems devuelve solo vencidos, más atrasados primero, con tope", () => {
  const items = [
    { id: "a", lesson: "L1", level: 0, due: 10 },
    { id: "b", lesson: "L1", level: 0, due: 5 },
    { id: "c", lesson: "L1", level: 0, due: 99 },
  ];
  assert.deepEqual(dueItems(items, 10, 5).map((i) => i.id), ["b", "a"]);
  assert.deepEqual(dueItems(items, 10, 1).map((i) => i.id), ["b"]);
});

test("interleave alterna temas", () => {
  const items = ["a1", "a2", "b1", "b2"].map((id) => ({ id, lesson: id[0] }));
  assert.deepEqual(interleave(items).map((i) => i.id), ["a1", "b1", "a2", "b2"]);
});

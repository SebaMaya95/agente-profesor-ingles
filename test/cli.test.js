import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../src/cli.js", import.meta.url));

const run = (file, stdin) =>
  spawnSync(process.execPath, [cli, "--no-ai"], {
    input: stdin,
    encoding: "utf8",
    timeout: 20_000,
    env: { ...process.env, ALUMNO_FILE: file, TUTOR_SEED: "1" },
  });

const tempFile = () => join(mkdtempSync(join(tmpdir(), "alumno-")), "alumno.json");

test("la consola muestra la unidad 1 con su tiempo verbal, la lección y el mapa, y guarda el progreso", () => {
  const file = tempFile();
  const result = run(file, "1\n".repeat(60));
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Unidad 1: Personal Information/);
  assert.match(result.stdout, /Tiempo verbal: Presente Simple/);
  assert.match(result.stdout, /Lección:/);
  assert.match(result.stdout, /Tu mapa/);
  const saved = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(saved.version, 3);
  assert.ok(Object.keys(saved.items).length > 0);
});

test("si se cierra la entrada en medio de la práctica, guarda y termina sin colgarse", () => {
  const file = tempFile();
  const result = run(file, "1\n");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(readFileSync(file, "utf8")).version, 3);
});

test("con la práctica completa aparecen ejercicios de varios tipos, incluida una historia", () => {
  const file = tempFile();
  const result = run(file, "1\n".repeat(200));
  assert.equal(result.status, 0, result.stderr);
  const skills = new Set([...result.stdout.matchAll(/^\[([^\]]+)\]/gm)].map((m) => m[1]));
  assert.ok(skills.size >= 5, [...skills].join(", "));
});

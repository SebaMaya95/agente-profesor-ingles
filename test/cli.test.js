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
    timeout: 15_000,
    env: { ...process.env, ALUMNO_FILE: file, TUTOR_SEED: "1" },
  });

const tempFile = () => join(mkdtempSync(join(tmpdir(), "alumno-")), "alumno.json");

test("la consola muestra el nivel 1 y el mapa, y guarda el progreso", () => {
  const file = tempFile();
  const result = run(file, "1\n1\n1\n1\n1\n1\n1\n1\n1\n1\n1\n1\n");
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Nivel 1: Presentarte/);
  assert.match(result.stdout, /Tu mapa/);
  const saved = JSON.parse(readFileSync(file, "utf8"));
  assert.equal(saved.version, 2);
  assert.ok(Object.keys(saved.phrases).length > 0);
});

test("si se cierra la entrada en medio de la práctica, guarda y termina sin colgarse", () => {
  const file = tempFile();
  const result = run(file, "1\n");
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(readFileSync(file, "utf8")).version, 2);
});

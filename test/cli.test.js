import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../src/cli.js", import.meta.url));

const run = (file, stdin) =>
  spawnSync(process.execPath, [cli, "--no-ai"], {
    input: stdin,
    encoding: "utf8",
    timeout: 15_000,
    env: { ...process.env, ALUMNO_FILE: file },
  });

test("sesión 1 presenta el primer tema; sesión 2 repasa y corrige en código", () => {
  const file = join(mkdtempSync(join(tmpdir(), "alumno-")), "alumno.json");

  const s1 = run(file, "");
  assert.equal(s1.status, 0);
  assert.match(s1.stdout, /Tema nuevo: Saludos/);

  // Forzamos que todo venza para simular el paso de los días.
  const state = JSON.parse(readFileSync(file, "utf8"));
  for (const it of Object.values(state.items)) it.due = 0;
  writeFileSync(file, JSON.stringify(state));

  // Orden de repaso: hello, goodbye, please. Dos correctas y una incorrecta.
  const s2 = run(file, "hello\nwrong\nplease\n");
  assert.equal(s2.status, 0);
  assert.match(s2.stdout, /Repaso \(3\)/);
  assert.equal((s2.stdout.match(/✓ Correcto/g) ?? []).length, 2);
  assert.equal((s2.stdout.match(/✗ Era:/g) ?? []).length, 1);

  const after = JSON.parse(readFileSync(file, "utf8"));
  const levels = Object.values(after.items).map((it) => it.level);
  assert.equal(levels.filter((l) => l === 1).length, 2); // los aciertos subieron
  assert.ok(after.introduced.length >= 2); // la sesión 2 abrió el tema siguiente
});

test("si se cierra la entrada en medio del repaso, guarda y termina sin colgarse", () => {
  const file = join(mkdtempSync(join(tmpdir(), "alumno-")), "alumno.json");
  run(file, "");
  const state = JSON.parse(readFileSync(file, "utf8"));
  for (const it of Object.values(state.items)) it.due = 0;
  writeFileSync(file, JSON.stringify(state));

  const s = run(file, "hello\n"); // solo una respuesta y fin de entrada
  assert.equal(s.status, 0);
});

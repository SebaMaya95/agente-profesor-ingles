import { test } from "node:test";
import assert from "node:assert/strict";
import Anthropic from "@anthropic-ai/sdk";
import { describeError } from "../src/tutor.js";

test("describeError distingue timeout, conexión y errores genéricos", () => {
  assert.match(describeError(new Anthropic.APIConnectionTimeoutError()), /tardó demasiado/);
  assert.match(describeError(new Anthropic.APIConnectionError({ message: "x" })), /conexión/);
  assert.equal(describeError(new Error("boom")), "boom");
});

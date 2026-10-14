import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

import { classifyFailure, formatMessage, formatSeconds, parseJsonMessages } from "../lean.js";
import { leanProjectDir, packageRoot } from "../config.js";

describe("configuration", () => {
  it("resolves the repository root from the built output location", () => {
    // Regression guard: `dist/config.js` sits one level below the project
    // root. Over-counting here silently points the server at a directory that
    // does not exist.
    assert.equal(path.basename(packageRoot), "lean-mcp");
    assert.ok(existsSync(path.join(packageRoot, "package.json")), "package.json not found at packageRoot");
  });

  it("defaults the Lean project to the bundled sandbox project", () => {
    assert.equal(leanProjectDir, path.join(packageRoot, "lean-project"));
    assert.ok(existsSync(path.join(leanProjectDir, "lakefile.lean")), "lakefile.lean missing");
    assert.ok(existsSync(path.join(leanProjectDir, "lean-toolchain")), "lean-toolchain missing");
  });
});

describe("parseJsonMessages", () => {
  it("parses a single error message with position", () => {
    const stdout = JSON.stringify({
      severity: "error",
      data: "Unknown identifier `foo`",
      pos: { line: 3, column: 7 },
    });
    const messages = parseJsonMessages(stdout);
    assert.equal(messages.length, 1);
    assert.equal(messages[0]?.severity, "error");
    assert.equal(messages[0]?.message, "Unknown identifier `foo`");
    assert.equal(messages[0]?.line, 3);
    assert.equal(messages[0]?.column, 7);
  });

  it("ignores non-JSON lines mixed into the stream", () => {
    const stdout = [
      "info: some banner text",
      JSON.stringify({ severity: "error", data: "boom" }),
      "",
      "warning: trailing noise",
    ].join("\n");
    const messages = parseJsonMessages(stdout);
    assert.equal(messages.length, 1);
    assert.equal(messages[0]?.message, "boom");
  });

  it("skips malformed JSON without throwing", () => {
    const stdout = ['{"severity":"error","data":', "not json at all"].join("\n");
    assert.deepEqual(parseJsonMessages(stdout), []);
  });

  it("skips JSON objects without a string `data` field", () => {
    const stdout = JSON.stringify({ severity: "error", pos: { line: 1, column: 0 } });
    assert.deepEqual(parseJsonMessages(stdout), []);
  });

  it("handles messages that carry no position", () => {
    const stdout = JSON.stringify({ severity: "error", data: "no position here" });
    const messages = parseJsonMessages(stdout);
    assert.equal(messages.length, 1);
    assert.equal(messages[0]?.line, undefined);
  });

  it("preserves several messages in order", () => {
    const stdout = [
      JSON.stringify({ severity: "error", data: "first" }),
      JSON.stringify({ severity: "warning", data: "second" }),
      JSON.stringify({ severity: "error", data: "third" }),
    ].join("\n");
    const messages = parseJsonMessages(stdout);
    assert.deepEqual(
      messages.map((m) => m.message),
      ["first", "second", "third"],
    );
  });
});

describe("formatMessage", () => {
  it("includes line, column and severity", () => {
    assert.equal(
      formatMessage({ severity: "error", message: "type mismatch", line: 12, column: 4 }),
      "12:4: error: type mismatch",
    );
  });

  it("omits the position when it is unknown", () => {
    assert.equal(formatMessage({ severity: "error", message: "global failure" }), "error: global failure");
  });

  it("defaults a missing column to zero", () => {
    assert.equal(formatMessage({ severity: "warning", message: "careful", line: 2 }), "2:0: warning: careful");
  });
});

describe("classifyFailure", () => {
  it("recognises unsolved goals", () => {
    const hint = classifyFailure("unsolved goals\n⊢ 2 + 2 = 5");
    assert.match(hint, /simp|ring|omega|nlinarith/);
  });

  it("recognises unknown identifiers", () => {
    assert.match(classifyFailure("unknown identifier `foo`"), /#check|lean-explore/);
  });

  it("recognises type mismatches", () => {
    assert.match(classifyFailure("type mismatch"), /ring|norm_num/);
    assert.match(classifyFailure("not definitionally equal"), /ring|norm_num/);
  });

  it("recognises syntax errors", () => {
    assert.match(classifyFailure("unexpected token 'in'; expected ','"), /söz dizimi|notasyon/);
  });

  it("recognises rewrite failures", () => {
    assert.match(classifyFailure("rewrite failed: Did not find an occurrence"), /show|change|simp/);
  });

  it("falls back to a generic hint", () => {
    assert.ok(classifyFailure("weird and exotic failure").length > 0);
  });
});

describe("formatSeconds", () => {
  it("renders whole seconds without a decimal", () => {
    assert.equal(formatSeconds(180_000), "180 saniye");
  });

  it("renders fractional seconds with one decimal", () => {
    assert.equal(formatSeconds(1500), "1.5 saniye");
  });

  it("renders sub-second durations in milliseconds", () => {
    assert.equal(formatSeconds(200), "200 ms");
  });
});
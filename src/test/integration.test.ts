// Integration tests: run the real Lean compiler and assert the contract.
// Skipped automatically when no `lake` is available on PATH.
import assert from "node:assert/strict";
import path from "node:path";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, it, before } from "node:test";

import { LeanChecker } from "../lean.js";
import { leanEnv, leanProjectDir } from "../config.js";

function lakePresent(): boolean {
  const probe = spawnSync("lake", ["--version"], { env: leanEnv(), encoding: "utf8" });
  return probe.status === 0;
}

/** True once the project has been built, so Mathlib is importable. */
function mathlibBuilt(): boolean {
  return existsSync(path.join(leanProjectDir, ".lake", "packages", "mathlib", "Mathlib.lean"));
}

const leanAvailable = lakePresent();

describe("LeanChecker (integration)", { skip: leanAvailable ? false : "lake not available" }, () => {
  const checker = new LeanChecker();

  before(() => {
    assert.ok(existsSync(leanProjectDir), `lean project missing at ${leanProjectDir}`);
  });

  it("reports success for code that compiles", async () => {
    // Not `theorem example`: `example` is a reserved keyword in Lean and
    // would make this a parse error instead of a successful elaboration.
    const result = await checker.check("theorem add_two : 1 + 1 = 2 := by rfl");
    assert.equal(result.status, "success");
    assert.deepEqual(result.diagnostics, []);
  });

  it("reports an error with compiler diagnostics for a false claim", async () => {
    const result = await checker.check("theorem bad : 1 + 1 = 3 := by rfl");
    assert.equal(result.status, "error");
    assert.ok(result.diagnostics.length > 0, "expected at least one diagnostic");
    const joined = result.diagnostics.join("\n");
    assert.match(joined, /error/, "diagnostics should carry severity");
    assert.match(joined, /not definitionally equal|unsolved goals|Tactic/, ": " + joined);
  });

  it("reports an error for an unknown identifier", async () => {
    // A bare lowercase name would be auto-bound as an implicit variable by the
    // elaborator (autoImplicit is on by default for `lean` invocations), so it
    // would fail at `rfl` instead. A qualified name forces "Unknown constant".
    const result = await checker.check("theorem x : Nat.succcccc = 1 := by rfl");
    assert.equal(result.status, "error");
    assert.match(result.diagnostics.join("\n"), /unknown (identifier|constant)/i);
  });

  it("reports an error for a syntax error", async () => {
    const result = await checker.check("theorem oops := by by by rfl");
    assert.equal(result.status, "error");
    assert.ok(result.diagnostics.length > 0);
  });

  it("reports success but flags `sorry` in diagnostics", async () => {
    const result = await checker.check("theorem hollow : 1 = 1 := by sorry");
    // Lean's exit code is 0 here, so the honest verdict is success...
    assert.equal(result.status, "success");
    // ...but the warning must reach the model so the proof is not mistaken
    // for a real one.
    assert.match(result.diagnostics.join("\n"), /sorry/i);
  });

  it("reports success for a file with no declarations", async () => {
    const result = await checker.check("");
    assert.equal(result.status, "success");
  });

  it("surfaces `information` output such as the answer to `#check`", async () => {
    // `#check`/`#print`/`#eval` emit `severity: "information"`. Dropping them
    // would silently discard the actual answer to a lemma lookup.
    const result = await checker.check("#check Nat.add_comm");
    assert.equal(result.status, "success");
    assert.ok(
      result.diagnostics.some((d) => d.includes("Nat.add_comm")),
      `expected the #check statement, got ${JSON.stringify(result.diagnostics)}`,
    );
  });

  it("runs concurrent checks without crossing results", async () => {
    const codes = [
      "theorem c1 : 1 + 1 = 2 := by rfl",
      "theorem c2 : 1 + 1 = 3 := by rfl",
      "theorem c3 : 2 + 2 = 4 := by rfl",
      "theorem c4 : 2 + 2 = 5 := by rfl",
      "theorem c5 : 3 + 3 = 6 := by rfl",
    ];
    const results = await Promise.all(codes.map((code) => checker.check(code)));
    assert.deepEqual(
      results.map((r) => r.status),
      ["success", "error", "success", "error", "success"],
    );
  });

  it("uses Mathlib when the project is built", { skip: mathlibBuilt() ? false : "mathlib not built" }, async () => {
    // `norm_num` ships in Mathlib's tactic set, so the whole module is
    // imported. A narrow import such as `Mathlib.Data.Nat.Basic` brings in the
    // arithmetic lemmas but not the tactic, and would fail for that reason.
    const result = await checker.check("import Mathlib\nexample : 2 + 2 = 4 := by norm_num");
    assert.equal(result.status, "success");
  });

  it("reports an error when Mathlib tactics are used without importing them", async () => {
    // Guards the previous test from becoming vacuous: the same snippet without
    // the import must fail, proving the import is what makes it work.
    const result = await checker.check("example : 2 + 2 = 4 := by norm_num");
    assert.equal(result.status, "error");
    assert.match(result.diagnostics.join("\n"), /unknown tactic/i);
  });
});
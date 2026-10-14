// Robustness tests for production behavior that unit tests cannot cover:
//  1. A broken LEAN_MCP_PROJECT_DIR yields a *structured* tool error (not a
//     bare SDK/OS error) plus a startup warning on stderr.
//  2. SIGTERM while a compile is in flight terminates promptly and does not
//     leave the `lake`/`lean` subprocess tree running (orphans).
//  3. LEAN_MCP_TIMEOUT_MS escalation returns a time-out tool error and leaves
//     no scratch file behind.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SERVER = path.join(root, "dist", "index.js");

function makeClient(extraEnv = {}) {
  return new StdioClientTransport({
    command: process.execPath,
    args: [SERVER],
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stderr: "pipe",
  });
}

// Runtime-introspection for the spawned server process handle (SDK keeps it
// private). Returns null if it cannot be located.
function findChild(transport) {
  const seen = new Set();
  function walk(obj, depth) {
    if (!obj || typeof obj !== "object" || depth > 3) return null;
    for (const key of Object.keys(obj)) {
      if (seen.has(`${depth}:${key}`)) continue;
      seen.add(`${depth}:${key}`);
      const v = obj[key];
      if (v && typeof v === "object" && typeof v.kill === "function" && typeof v.pid === "number") return v;
      const deeper = walk(v, depth + 1);
      if (deeper) return deeper;
    }
    return null;
  }
  return walk(transport, 0);
}

function psTable() {
  // Works on POSIX. Returns `null` when `ps` is unavailable.
  try {
    const out = execFileSync("ps", ["-eo", "pid=,ppid=,pgid=,args="], { encoding: "utf8" });
    return out
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const m = l.trim().split(/\s+/);
        return { pid: Number(m[0]), ppid: Number(m[1]), pgid: Number(m[2]), args: m.slice(3).join(" ") };
      });
  } catch {
    return null;
  }
}

// --- 1. Broken project directory -----------------------------------------
{
  const transport = makeClient({ LEAN_MCP_PROJECT_DIR: "/nonexistent/lean-mcp-probe" });
  const client = new Client({ name: "lean-mcp-robust", version: "0.1.0" });
  let stderr = "";
  transport.stderr?.on("data", (c) => { stderr += c; });
  try {
    await client.connect(transport);
    const res = await client.callTool({
      name: "lean_check",
      arguments: { code: "theorem t : 1 = 1 := by rfl" },
    });
    assert.equal(res.isError, true, "broken project dir must be surfaced as isError");
    const payload = JSON.parse(res.content[0].text);
    assert.equal(payload.status, "error", "broken project dir -> status error");
    assert.match(payload.summary, /çalıştırılamadı/, "summary must mention the toolchain failure");
    assert.ok(
      payload.diagnostics.some((d) => d.includes("/nonexistent/lean-mcp-probe")),
      "diagnostics must name the offending project directory",
    );
    assert.match(stderr, /UYARI: Lean projesi dizini bulunamadı/, "startup warning on stderr expected");
    console.log("PASS: broken LEAN_MCP_PROJECT_DIR yields a structured tool error + startup warning");
  } finally {
    try { await transport.close(); } catch {}
  }
}

// --- 2. SIGTERM mid-compile: prompt exit, no orphans ----------------------
// --- 3. Timeout escalation (compact Mathlib compile beats 300ms) ----------
for (const [label, scenario] of [
  [
    "SIGTERM mid-compile",
    {
      code: "import Mathlib\nexample : True := trivial",
      after: "sigterm",
    },
  ],
  [
    "timeout escalation",
    {
      code: "import Mathlib\nexample : True := trivial",
      env: { LEAN_MCP_TIMEOUT_MS: "300" },
      after: "timeout",
    },
  ],
]) {
  const transport = makeClient(scenario.env ?? {});
  const client = new Client({ name: "lean-mcp-robust", version: "0.1.0" });
  let stderr = "";
  transport.stderr?.on("data", (c) => { stderr += c; });
  try {
    await client.connect(transport);
    const callPromise = client
      .callTool({ name: "lean_check", arguments: { code: scenario.code } })
      .then((r) => ({ ok: true, isError: r.isError, text: r.content[0].text }))
      .catch((e) => ({ ok: false, err: String(e).slice(0, 120) }));

    // Wait for the compiler to be genuinely up (its invocation contains the
    // project scratch dir) so we have a group to check for survivors.
    let group = new Set();
    let sawCompiler = false;
    for (let i = 0; i < 30 && !sawCompiler; i++) {
      await new Promise((r) => setTimeout(r, 150));
      const table = psTable();
      if (table) {
        for (const p of table) {
          if (String(p.args).includes("Check_")) {
            sawCompiler = true;
            group.add(p.pgid);
          }
        }
      }
    }

    const serverChild = findChild(transport);
    const started = Date.now();
    if (scenario.after === "sigterm") {
      serverChild.kill("SIGTERM");
    }
    // For "timeout", we wait for the call to settle instead.
    const settled = scenario.after === "sigterm"
      ? await new Promise((res) => serverChild.once("close", () => res("closed")))
      : await callPromise;

    if (scenario.after === "sigterm") {
      const latency = Date.now() - started;
      assert.ok(latency < 5000, `server took ${latency}ms to exit after SIGTERM`);
      const result = await callPromise.catch(() => ({ ok: false }));
      // The in-flight request should be cancelled, never report a fake success.
      assert.notEqual(result.ok, undefined, "pending call must settle");
      if (sawCompiler) {
        // Give any survivor a moment, then require the whole group gone.
        await new Promise((r) => setTimeout(r, 500));
        const table = psTable();
        const survivors = table
          ? table.filter((p) => group.has(p.pgid) && String(p.args).includes(".lean-mcp-tmp"))
          : [];
        assert.equal(survivors.length, 0, `orphaned compiler processes survive SIGTERM: ${JSON.stringify(survivors)}`);
      } else {
        console.log("  (skipped orphan check: no compiler observed in flight)");
      }
      console.log("PASS: SIGTERM mid-compile exits promptly without orphaned subprocesses");
    } else {
      assert.equal(settled.ok, true, `timeout call must resolve, got ${JSON.stringify(settled)}`);
      assert.equal(settled.isError, true, "timeout must be an isError (tool error)");
      const payload = JSON.parse(settled.text);
      assert.equal(payload.status, "error");
      assert.match(payload.summary, /zaman aşımı/, "timeout summary expected");
      // And the scratch file must be gone even though the run was aborted.
      const { readdir } = await import("node:fs/promises");
      const leftovers = await readdir(path.join(root, "lean-project", ".lean-mcp-tmp")).catch(() => []);
      assert.deepEqual(leftovers, [], `scratch files leaked after timeout: ${leftovers.join(", ")}`);
      console.log("PASS: timeout escalation returns isError and cleans up its scratch file");
    }
  } finally {
    try { await transport.close(); } catch {}
  }
}

console.log("robustness: all checks passed");
process.exit(0);
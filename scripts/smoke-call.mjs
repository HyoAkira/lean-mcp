// Smoke test: calls lean_check over real stdio and inspects the response.
import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(root, "dist", "index.js")],
  cwd: root,
});

const client = new Client({ name: "lean-mcp-smoke", version: "0.1.0" });

// `example` is a reserved keyword; use a distinct theorem name.
// `rfl` (not `norm_num`) keeps this independent of Mathlib being built.
const GOOD = "theorem add_two : 1 + 1 = 2 := by rfl";
const BAD = "theorem add_two : 1 + 1 = 3 := by rfl";

try {
  await client.connect(transport);

  const ok = await client.callTool({ name: "lean_check", arguments: { code: GOOD } });
  const okPayload = JSON.parse(ok.content[0].text);
  assert.equal(ok.isError, false, "a compiling snippet must not be a tool error");
  assert.equal(okPayload.status, "success", `expected success, got ${ok.content[0].text}`);
  assert.deepEqual(okPayload.diagnostics, []);
  console.log("PASS: valid snippet ->", JSON.stringify(okPayload));

  const bad = await client.callTool({ name: "lean_check", arguments: { code: BAD } });
  const badPayload = JSON.parse(bad.content[0].text);
  // A rejected proof is a normal compiler verdict, not a tool failure. If this
  // is flagged `isError`, the client surfaces an exception and the model can no
  // longer iterate on the diagnostics.
  assert.equal(bad.isError, false, "a rejected proof must not be a tool error");
  assert.equal(badPayload.status, "error", `expected error, got ${bad.content[0].text}`);
  assert.ok(badPayload.diagnostics.length > 0, "errors must carry diagnostics");
  console.log("PASS: invalid snippet ->", JSON.stringify(badPayload, null, 2));

  // `information` output (the answer to `#check`/`#eval`) must reach the model.
  const info = await client.callTool({ name: "lean_check", arguments: { code: "#check Nat.add_comm" } });
  const infoPayload = JSON.parse(info.content[0].text);
  assert.equal(infoPayload.status, "success");
  assert.ok(
    infoPayload.diagnostics.some((d) => d.includes("Nat.add_comm")),
    `#check output must be surfaced, got ${JSON.stringify(infoPayload)}`,
  );
  console.log("PASS: #check info ->", JSON.stringify(infoPayload, null, 2));

  process.exit(0);
} catch (error) {
  console.error("FAIL:", error);
  process.exit(1);
}
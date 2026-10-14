// Stress test: many concurrent checks must each get an isolated scratch file.
// Each snippet is self-identifying, so a crossed result would be detectable.
import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
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

const client = new Client({ name: "lean-mcp-concurrency", version: "0.1.0" });

const N = 12;
const jobs = Array.from({ length: N }, (_, i) => {
  const value = i + 1;
  const shouldFail = i % 3 === 0;
  // The statement is true only when we intend success; the failures are
  // genuine type errors so `error` is the correct verdict for them.
  const code = shouldFail
    ? `theorem t${i} : ${value} = ${value} + 1 := by rfl`
    : `theorem t${i} : ${value} + ${value} = ${value * 2} := by rfl`;
  return { i, shouldFail, code };
});

try {
  await client.connect(transport);

  const results = await Promise.all(
    jobs.map((j) => client.callTool({ name: "lean_check", arguments: { code: j.code } })),
  );

  let mismatches = 0;
  results.forEach((res, i) => {
    const payload = JSON.parse(res.content[0].text);
    const expected = jobs[i].shouldFail ? "error" : "success";
    if (payload.status !== expected) {
      mismatches++;
      console.error(`  job ${i}: expected ${expected}, got ${payload.status}`);
    }
  });

  assert.equal(mismatches, 0, `${mismatches} result(s) did not match expectation`);

  // No scratch files may be left behind after the run.
  const scratchDir = path.join(root, "lean-project", ".lean-mcp-tmp");
  let leftovers = [];
  try {
    leftovers = await readdir(scratchDir);
  } catch {
    leftovers = [];
  }
  assert.deepEqual(leftovers, [], `scratch files leaked: ${leftovers.join(", ")}`);

  console.log(`PASS: ${N} concurrent checks all correct, no leaked scratch files`);
  process.exit(0);
} catch (error) {
  console.error("FAIL:", error);
  process.exit(1);
}
// Smoke test: drives the server over real stdio, exactly as a client would.
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

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name);
  assert.deepEqual(names, ["lean_check"], "server must expose exactly one tool");

  const schema = tools.tools[0]?.inputSchema;
  assert.deepEqual(
    Object.keys(schema?.properties ?? {}),
    ["code"],
    "lean_check must accept exactly one input property: code",
  );

  console.log("PASS: server starts and advertises the lean_check tool");
  process.exit(0);
} catch (error) {
  console.error("FAIL:", error);
  process.exit(1);
}
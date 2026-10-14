#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { LeanChecker } from "./lean.js";
import { leanEnv, leanProjectDir } from "./config.js";

const checker = new LeanChecker();

const server = new McpServer(
  { name: "lean-mcp", version: "0.1.0" },
  {
    capabilities: { tools: {} },
    instructions:
      "Lean 4 kodunu yerel olarak derler ve derleyicinin geri bildirimini döndürür. " +
      "Bir ispatı doğrulamak için `lean_check` aracını çağır; kodun gerçekten derlendiğinden emin olmadan ispatı tamamlanmış sayma.",
  },
);

server.registerTool(
  "lean_check",
  {
    title: "Lean Kodunu Derle",
    description:
      "Verilen Lean 4 kodunu yerel Lean derleyicisiyle çalıştırır. " +
      "Mathlib ve temel Lean kütüphanesi kullanılabilir. " +
      "Derleme başarılıysa status=success, başarısızsa derleyicinin hata mesajları diagnostics içinde döner.",
    inputSchema: {
      code: z.string().describe("Çalıştırılacak Lean 4 kaynak kodu."),
    },
    // Declaring the output shape keeps `structuredContent` spec-compliant and
    // pins the contract: exactly these three fields, nothing else (FR-02).
    outputSchema: {
      status: z.enum(["success", "error"]).describe("Derleme sonucunun durumu."),
      summary: z.string().describe("Sonucun kısa açıklaması."),
      diagnostics: z.array(z.string()).describe("Derleyiciden gelen hata, uyarı ve bilgi mesajları."),
    },
  },
  async ({ code }) => {
    const result = await checker.check(code);
    // `toolError` is tooling bookkeeping, not part of `lean_check`'s declared
    // output, so strip it before building the payload the contract promises.
    const { toolError, ...payload } = result;
    return {
      structuredContent: { ...payload },
      content: [
        { type: "text" as const, text: JSON.stringify(payload, null, 2) },
      ],
      // `isError` marks a failure of the *tool* (missing toolchain, timeout) —
      // not a rejected proof. A wrong proof is the expected, normal outcome of a
      // compiler: reporting it as a tool error turns every refinement step into
      // an exception and breaks the iterate-on-diagnostics loop. The verdict
      // lives in `status`/`diagnostics`, which the model reads directly.
      isError: toolError === true,
    };
  },
);

/**
 * Operational warnings, written to stderr (never stdout, which belongs to the
 * MCP protocol). Checks are non-fatal: every `lean_check` call reports a
 * structured error when the toolchain is broken, but ops gain from seeing the
 * problem at startup.
 */
function warnAboutEnvironment(): void {
  if (!existsSync(leanProjectDir)) {
    process.stderr.write(
      `[lean-mcp] UYARI: Lean projesi dizini bulunamadı: ${leanProjectDir}\n` +
        "[lean-mcp] LEAN_MCP_PROJECT_DIR değişkenini var olan bir lake projesine ayarlayın.\n",
    );
    return;
  }
  const probe = spawnSync("lake", ["--version"], { env: leanEnv(), encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    process.stderr.write(
      "[lean-mcp] UYARI: `lake` bulunamadı veya başlatılamadı; derleme çağrıları hata döndürür.\n" +
        "[lean-mcp] elan kurulu değilse: `elan toolchain install leanprover/lean4:stable`.\n",
    );
  }
}

let shuttingDown = false;

/**
 * Clean shutdown on termination signals. The critical job is killing in-flight
 * `lake env lean` children so a stuck tactic cannot keep running as an orphan
 * after the server exits.
 */
function shutdown(reason: "SIGTERM" | "SIGINT" | "SIGHUP" | "stdin-closed"): void {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stderr.write(`[lean-mcp] ${reason} alındı, aktif derlemeler sonlandırılıyor…\n`);
  try {
    checker.abortActive();
  } catch {
    // Nothing else to do on the way out.
  }
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGHUP", () => shutdown("SIGHUP"));
// When the stdio parent disconnects, stdin closes; treat it as shutdown.
process.stdin.on("close", () => shutdown("stdin-closed"));

async function main(): Promise<void> {
  warnAboutEnvironment();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  // stdio transport owns stdout; diagnostics must go to stderr.
  process.stderr.write(`lean-mcp failed to start: ${String(error)}\n`);
  process.exit(1);
});
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  checkTimeoutMs,
  killGraceMs,
  leanEnv,
  leanProjectDir,
  maxOutputBytes,
  scratchDir,
} from "./config.js";

/** Structured answer returned by the `lean_check` tool. */
export interface CheckResult {
  status: "success" | "error";
  summary: string;
  diagnostics: string[];
  /**
   * True when the *tool* could not run (missing toolchain, timeout), as opposed
   * to the submitted code simply failing to compile. `status` describes the
   * code; `toolError` describes the tool. It is not part of the tool's declared
   * output contract, so `index.ts` strips it before returning the payload.
   */
  toolError?: boolean;
}

/** One message emitted by the Lean elaborator. */
interface LeanMessage {
  severity: string;
  message: string;
  line?: number;
  column?: number;
}

/** Raw result of running the `lean` binary once. */
interface RawRun {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  /** True when the child never started (missing `lake`, bad project, …). */
  spawnFailed: boolean;
  spawnError?: Error;
}

export class LeanChecker {
  /** Serialises checks so concurrent tool calls cannot interleave scratch files. */
  private queue: Promise<unknown> = Promise.resolve();

  /** Lean subprocesses currently elaborating a snippet. */
  private active = new Set<import("node:child_process").ChildProcess>();

  /** One-time stale scratch cleanup (files left by a previously killed server). */
  private cleanedScratch = false;

  /**
   * Kills all in-flight Lean subprocesses. Called on server shutdown so a
   * SIGTERM to the MCP process does not orphan a `lake env lean` child that
   * could keep running (a stuck tactic forever).
   */
  abortActive(): void {
    for (const child of this.active) {
      killTree(child, "SIGKILL");
    }
    this.active.clear();
  }

  /** Runs `code` through the Lean elaborator and classifies the outcome. */
  check(code: string): Promise<CheckResult> {
    const run = this.queue.then(
      () => this.checkUnserialised(code),
      () => this.checkUnserialised(code),
    );
    // Keep the chain alive regardless of individual failures.
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async checkUnserialised(code: string): Promise<CheckResult> {
    let file: string | undefined;
    try {
      file = await this.writeScratchFile(code);
      const run = await this.runLean(file);
      return this.interpret(run);
    } catch (error) {
      // Infrastructure failures (missing/read-only project dir, disk full, …)
      // must become a structured `toolError` result, never an unhandled
      // rejection that surfaces as a bare SDK error to the model.
      return this.infraError(error);
    } finally {
      // Also remove scratch files created before a failure in writeScratchFile.
      if (file) await rm(file, { force: true }).catch(() => undefined);
    }
  }

  /** Writes the snippet into the project so it picks up Mathlib via LEAN_PATH. */
  private async writeScratchFile(code: string): Promise<string> {
    await mkdir(scratchDir, { recursive: true });
    // On a fresh server, drop leftovers from a previously killed process so a
    // long-lived deployment does not accumulate stale snippet files.
    if (!this.cleanedScratch) {
      this.cleanedScratch = true;
      await this.cleanStaleScratch();
    }
    const file = path.join(scratchDir, `Check_${randomUUID()}.lean`);
    await writeFile(file, code, "utf8");
    return file;
  }

  private async cleanStaleScratch(): Promise<void> {
    try {
      const entries = await readdir(scratchDir);
      await Promise.all(
        entries
          .filter((name) => name.startsWith("Check_") && name.endsWith(".lean"))
          .map((name) => rm(path.join(scratchDir, name), { force: true })),
      );
    } catch {
      // If the directory cannot be listed, individual checks will report it.
    }
  }

  /**
   * Elaborates the snippet with `lake env lean --json`. `--json` yields one
   * JSON object per compiler message, which is far more reliable to parse than
   * the pretty-printed human format.
   */
  private runLean(file: string): Promise<RawRun> {
    return new Promise<RawRun>((resolve) => {
      const child = spawn("lake", ["env", "lean", "--json", file], {
        cwd: leanProjectDir,
        env: leanEnv(),
        stdio: ["ignore", "pipe", "pipe"],
        // Put the child in its own process group: `lake` execs/waits on a `lean`
        // grandchild, and silently reaps it only on the *happy* path. Killing
        // the group (`killTree`) is the only reliable way to take a stuck
        // tactic down together with its compiler instead of leaving an orphan.
        detached: true,
      });
      this.active.add(child);

      let stdout = "";
      let stderr = "";
      let timedOut = false;
      let settled = false;

      const done = (result: RawRun) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.active.delete(child);
        resolve(result);
      };

      const timer = setTimeout(() => {
        timedOut = true;
        killTree(child, "SIGTERM");
        // A `lean` process stuck in a tactic loop ignores SIGTERM, so escalate.
        const escalation = setTimeout(() => killTree(child, "SIGKILL"), killGraceMs);
        escalation.unref();
      }, checkTimeoutMs);

      const onData = (chunk: Buffer, sink: "stdout" | "stderr") => {
        const text = chunk.toString("utf8");
        if (sink === "stdout") {
          if (stdout.length < maxOutputBytes) stdout += text;
        } else if (stderr.length < maxOutputBytes) {
          stderr += text;
        }
      };

      child.stdout.on("data", (c: Buffer) => onData(c, "stdout"));
      child.stderr.on("data", (c: Buffer) => onData(c, "stderr"));

      child.on("error", (error: Error) => {
        done({
          stdout,
          stderr,
          code: null,
          signal: null,
          timedOut,
          spawnFailed: true,
          spawnError: error,
        });
      });

      child.on("close", (code, signal) => {
        done({ stdout, stderr, code, signal, timedOut, spawnFailed: false });
      });
    });
  }

  /** Turns a raw `lean` run into the tool's structured response. */
  private interpret(run: RawRun): CheckResult {
    if (run.spawnFailed) {
      const reason = run.spawnError?.message ?? "unknown error";
      return {
        status: "error",
        toolError: true,
        summary: "Lean çalıştırılamadı.",
        diagnostics: [
          `Lean araç zinciri bulunamadı veya başlatılamadı: ${reason}`,
          `Proje dizini: ${leanProjectDir}`,
          "elan kurulu değilse `elan toolchain install leanprover/lean4:stable` çalıştırılmalıdır.",
        ],
      };
    }

    if (run.timedOut) {
      return {
        status: "error",
        toolError: true,
        summary: "Lean kodu zaman aşımına uğradı.",
        diagnostics: [
          `Derleme ${formatSeconds(checkTimeoutMs)} içinde tamamlanmadı ve iptal edildi.`,
          "Olası nedenler: sonsuza kadar süren bir taktik (`decide`, `simp`, `norm_num`) " +
            "ya da derleme kilidi tutan başka bir lake işlemi.",
          "Uzun süren taktikleri sadeleştirmeyi veya ispatı küçük adımlara bölerek denemeyi tercih edin.",
        ],
      };
    }

    const messages = parseJsonMessages(run.stdout);

    // A `severity: "error"` message is the authoritative "this code did not
    // elaborate" signal, regardless of the process exit code.
    const errors = messages.filter((m) => m.severity === "error");
    if (errors.length > 0) {
      // Keep the non-error traffic too: during a failed attempt the compiler
      // often still reports useful context (unused-variable warnings, hints,
      // goal snapshots from earlier steps) that the model should see alongside
      // the errors instead of having it silently dropped.
      const extras = messages.filter((m) => m.severity !== "error").map(formatMessage);
      return {
        status: "error",
        summary: `Lean kodu derlenemedi. İpucu: ${classifyFailure(errors.map((m) => m.message).join("\n"))}`,
        diagnostics: [...errors.map(formatMessage), ...extras],
      };
    }

    // Everything else is a positive result that still carries information the
    // model needs: `warning` (e.g. unused variable, `sorry`) and `information`
    // (e.g. the statement printed by `#check`/`#print`, the value from `#eval`).
    // These were previously dropped, which silently discarded the answer to any
    // `#check`/`#eval` query — a core move in real proof work.
    const notes = messages.filter((m) => m.severity !== "error");
    if (notes.length > 0) {
      const warnings = notes.filter((m) => m.severity === "warning");
      const usesSorry = notes.some((m) => m.severity === "warning" && /`sorry`/.test(m.message));
      const summary = usesSorry
        ? "Lean kodu derlendi ancak ispat tamamlanmadı (`sorry` içeriyor)."
        : warnings.length > 0
          ? "Lean kodu uyarılarla derlendi."
          : "Lean kodu başarıyla derlendi.";
      return { status: "success", summary, diagnostics: notes.map(formatMessage) };
    }

    if (run.code === 0) {
      return { status: "success", summary: "Lean kodu başarıyla derlendi.", diagnostics: [] };
    }

    // Non-zero exit without a parsable message: surface the raw output so the
    // model still gets the compiler's words rather than a silent failure.
    const raw = [run.stderr.trim(), run.stdout.trim()].filter(Boolean).join("\n");
    return {
      status: "error",
      summary: "Lean kodu derlenemedi.",
      diagnostics: raw ? [raw] : ["Lean derleyicisi hata döndürdü ancak açıklama üretmedi."],
    };
  }

  /**
   * Converts an unexpected infrastructure failure (missing project directory,
   * scratch area not writable, disk full, …) into a structured `toolError`
   * result instead of letting the raw error escape to the client.
   */
  private infraError(error: unknown): CheckResult {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      toolError: true,
      summary: "Lean çalıştırılamadı.",
      diagnostics: [
        `Altyapı hatası: ${reason}`,
        `Lean projesi dizini: ${leanProjectDir}`,
        "Dizinin var olduğunu, bir `lakefile.lean` içerdiğini ve bağımlılıkların derlendiğini " +
          "(`lake build` veya `lake exe cache get`) doğrulayın.",
      ],
    };
  }
}

/**
 * Sends `signal` to a child's entire process group (`lake` reaps its `lean`
 * grandchild only on the clean path, so group signalling is needed to take a
 * stuck elaboration down). Falls back to signalling just the child when the
 * group cannot be addressed (non-POSIX or group already gone).
 */
function killTree(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid === undefined) {
    try {
      child.kill(signal);
    } catch {
      // Already gone.
    }
    return;
  }
  try {
    process.kill(-child.pid, signal);
    return;
  } catch {
    // Group may be gone or unavailable; fall through to the direct child.
  }
  try {
    child.kill(signal);
  } catch {
    // Already gone.
  }
}

/** Parses the newline-delimited JSON that `lean --json` writes to stdout. */
export function parseJsonMessages(stdout: string): LeanMessage[] {
  const messages: LeanMessage[] = [];
  for (const rawLine of stdout.split("\n")) {
    const trimmed = rawLine.trim();
    if (!trimmed.startsWith("{")) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      continue;
    }
    if (typeof parsed !== "object" || parsed === null) continue;
    const record = parsed as Record<string, unknown>;
    const data = record["data"];
    if (typeof data !== "string") continue;
    const pos = record["pos"];
    const position = typeof pos === "object" && pos !== null ? (pos as Record<string, unknown>) : undefined;
    const line = position?.["line"];
    const column = position?.["column"];
    messages.push({
      severity: typeof record["severity"] === "string" ? record["severity"] : "error",
      message: data,
      line: typeof line === "number" ? line : undefined,
      column: typeof column === "number" ? column : undefined,
    });
  }
  return messages;
}

/** Renders a duration in whole seconds, or milliseconds below one second. */
export function formatSeconds(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)} saniye`;
}

/** Renders a compiler message as `line:col: severity: text`. */
export function formatMessage(message: LeanMessage): string {
  const position =
    message.line !== undefined
      ? `${message.line}:${message.column ?? 0}: `
      : "";
  return `${position}${message.severity}: ${message.message}`;
}

/**
 * Maps common elaborator failures to a one-line action hint for the model.
 * Kept deliberately short so the summary stays readable; the raw compiler
 * diagnostics remain the source of truth.
 */
export function classifyFailure(text: string): string {
  if (/unsolved goals/.test(text)) {
    return "kalan hedefi `simp`, `ring`, `omega`, `nlinarith` gibi bir taktikle kapatmayı deneyin; olmuyorsa ispatı küçük adımlara bölün.";
  }
  if (/unknown (identifier|constant)/i.test(text)) {
    return "bilinmeyen bir isim kullanıldı; doğru lemma/sabit adını `#check` veya `lean-explore` ile doğrulayın.";
  }
  if (/rewrite failed|did not find/i.test(text)) {
    return "`rw` hedefte aradığı kalıbı bulamadı; hedefi önce `show`, `change` veya `simp` ile beklenen forma getirin.";
  }
  if (/type mismatch|not definitionally equal/i.test(text)) {
    return "tip uyuşmazlığı var; ifadeleri `ring`/`norm_num` ile dönüştürüp tekrar deneyin veya doğru lemmayı `lean-explore` ile arayın.";
  }
  if (/unexpected (token|term)|expected /i.test(text)) {
    return "söz dizimi hatası; parantez, ayraç ve notasyonu (ör. `∑ x ∈ s, f x`, `in` değil) kontrol edin.";
  }
  if (/tactic .* failed/i.test(text)) {
    return "taktik bu hedef için başarısız oldu; uygun taktiği (`rfl`, `simp`, `ring`, `omega`, `tauto`, `nlinarith`) deneyin.";
  }
  return "hatayı inceleyin ve ispatı küçük adımlara bölerek tekrar deneyin.";
}
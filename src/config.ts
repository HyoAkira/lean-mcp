import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * Repository root. This module compiles to `<root>/dist/config.js`, so the
 * project root is the parent of `dist`.
 */
export const packageRoot = path.resolve(here, "..");

function positiveIntFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

/**
 * The Lean project holding the toolchain and the Mathlib dependency.
 * Every snippet is elaborated against this project.
 */
export const leanProjectDir = path.resolve(
  process.env.LEAN_MCP_PROJECT_DIR ?? path.join(packageRoot, "lean-project"),
);

/** Scratch directory for snippet files handed to `lean`. */
export const scratchDir = path.join(leanProjectDir, ".lean-mcp-tmp");

/** Wall-clock budget for a single elaboration attempt, in milliseconds. */
export const checkTimeoutMs = positiveIntFromEnv("LEAN_MCP_TIMEOUT_MS", 180_000);

/** Cap on captured compiler output, in bytes. */
export const maxOutputBytes = positiveIntFromEnv("LEAN_MCP_MAX_OUTPUT_BYTES", 256 * 1024);

/** Grace period between SIGTERM and SIGKILL when a check is aborted. */
export const killGraceMs = 2_000;

/**
 * Directories that may hold the `lake` executable. `elan` installs the Lean
 * toolchain here, and this directory is frequently absent from a non-login
 * shell's PATH, so the child's environment is built explicitly.
 */
export function elanBinCandidates(): string[] {
  const elanHome = process.env.ELAN_HOME;
  const candidates: string[] = [];
  if (elanHome) candidates.push(path.join(elanHome, "bin"));
  candidates.push(path.join(os.homedir(), ".elan", "bin"));
  return candidates;
}

/**
 * Environment for spawned Lean processes: the inherited environment plus any
 * known elan bin directory, so `lake` resolves even when PATH is minimal.
 */
export function leanEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  const pathValue = env.PATH ?? "";
  const parts = pathValue.split(path.delimiter).filter(Boolean);
  for (const dir of elanBinCandidates()) {
    if (!parts.includes(dir)) parts.unshift(dir);
  }
  env.PATH = parts.join(path.delimiter);
  return env;
}
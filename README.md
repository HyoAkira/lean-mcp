# Lean MCP

An MCP server that compiles Lean 4 code with the local Lean toolchain and
returns the compiler's feedback in a structured response. It exposes a single
tool, `lean_check`. Mathlib and the basic Lean library are available to the
compiled snippets.

## What it is

`lean-mcp` is a small, self-contained Model Context Protocol (MCP) server for
proof work. A client (for example OpenCode) sends Lean source code to the
`lean_check` tool; the server writes the snippet into a Lake project, elaborates
it with the real Lean compiler, and returns a structured verdict. Success is
never taken from the model: a declaration counts as proved only if the Lean
elaborator accepts it. The server speaks MCP over stdio (`src/index.ts`).

## Features

- **One tool with a fixed contract.** `lean_check` accepts a single `code`
  string and returns exactly `status`, `summary` and `diagnostics`. The output
  shape is declared with Zod so `structuredContent` stays spec-compliant
  (`src/index.ts`).
- **Real compilation.** Snippets are elaborated by the local Lean toolchain
  through `lake env lean --json`; the verdict is the compiler's, not the
  model's (`src/lean.ts`).
- **Parsed, structured diagnostics.** Lean's JSON messages are parsed and
  rendered as `line:col: severity: text` strings (`src/lean.ts`).
- **Errors, warnings and information all reach the model.** A rejected proof
  returns its errors; a successful file keeps its warnings and `information`
  output, so the answers to `#check` / `#print` / `#eval` are not dropped
  (`src/lean.ts`).
- **`sorry` is flagged.** A file that compiles with `sorry` returns
  `status: "success"`, but the `summary` states that the proof is unfinished, so
  a hollow proof is not mistaken for a real one (`src/lean.ts`).
- **Actionable failure hints.** On failure the `summary` appends a one-line hint
  keyed to the failure class (`unsolved goals`, `unknown identifier`, syntax
  errors, and others) (`src/lean.ts`).
- **Serialized execution.** Concurrent tool calls run through a queue and each
  gets its own scratch file, so results cannot cross (`src/lean.ts`).
- **Timeouts terminate the whole process tree.** A stuck tactic is stopped with
  SIGTERM, then SIGKILL, and the server never blocks (`src/lean.ts`,
  `src/config.ts`).
- **Clean shutdown, no orphans.** SIGTERM, SIGINT, SIGHUP or a closed stdin
  aborts in-flight compilations by process group, so no `lake` or `lean`
  subprocess is left running (`src/index.ts`, `src/lean.ts`).
- **Structured failures when misconfigured.** A missing or read-only project
  directory returns a structured tool error instead of a raw OS error
  (`src/lean.ts`), and startup environment problems are reported on stderr
  (`src/index.ts`).

## Tech stack

| Component | Version | Source |
|---|---|---|
| Node.js | >= 20 | `package.json` (`engines`) |
| TypeScript | ^5.7 | `package.json` (`devDependencies`) |
| `@modelcontextprotocol/sdk` | ^1.12.0 | `package.json` (`dependencies`) |
| `zod` | ^3.23.8 | `package.json` (`dependencies`) |
| Lean 4 | `v4.34.1` (via elan) | `lean-project/lean-toolchain` |
| Mathlib | `v4.34.1` | `lean-project/lakefile.lean` |
| Lake | shipped with the Lean toolchain | `lean-project/lakefile.lean` |

## Architecture

```
MCP client (e.g. OpenCode)
        |  stdio: tools/call lean_check { code }
        v
src/index.ts   McpServer "lean-mcp", registerTool "lean_check"
        |
        v
src/lean.ts    LeanChecker: serial queue, timeout, process-group kill
        |  writes  <LEAN_MCP_PROJECT_DIR>/.lean-mcp-tmp/Check_<uuid>.lean
        v
lake env lean --json <file>        cwd = LEAN_MCP_PROJECT_DIR
        |  newline-delimited JSON messages on stdout
        v
parseJsonMessages -> classify -> { status, summary, diagnostics }
```

The entry point is `dist/index.js` (`package.json`, `bin` and `start`). The
scratch file is written inside the Lake project so the snippet picks up Mathlib
through `LEAN_PATH` (`src/lean.ts`).

## Getting started

### Prerequisites

- Node.js >= 20 (`package.json`).
- Lean 4 `v4.34.1`, installed with elan (`lean-project/lean-toolchain`).

### Install and build

```bash
npm install
npm run build
```

### Lean toolchain and Mathlib

```bash
# Lean 4 toolchain (matches lean-project/lean-toolchain)
elan toolchain install leanprover/lean4:v4.34.1

# Fetch Mathlib and its prebuilt .olean files
cd lean-project
lake exe cache get
lake build
```

Once `lake build` has run, `lean_check` can compile code against Mathlib.
Compilation time depends on the Mathlib cache being present
(`src/lean.ts`).

### Connect it to OpenCode

Add the server under `mcp.servers` in `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "servers": {
      "lean": {
        "type": "local",
        "command": ["node", "/path/to/lean-mcp/dist/index.js"],
        "environment": {
          "LEAN_MCP_PROJECT_DIR": "/path/to/lean-mcp/lean-project"
        }
      }
    }
  }
}
```

`command` is the executable followed by its arguments; naming the built entry
point `dist/index.js` is what starts the server. The server speaks MCP over
stdio (`src/index.ts`). Theorem search is deliberately not reimplemented here:
that is a separate server (`lean-explore`, a hosted MCP), and `lean_check` works
without it.

## Usage

### `lean_check`

**Input**

```json
{ "code": "theorem add_two : 1 + 1 = 2 := by rfl" }
```

> Note: `example` is a reserved keyword in Lean, so `theorem example : ...` is
> invalid. Use a named theorem such as `theorem add_two : ...`, or
> `example : ...` for an anonymous one.

**Successful response**

```json
{
  "status": "success",
  "summary": "Lean kodu başarıyla derlendi.",
  "diagnostics": []
}
```

(`summary` reads: "Lean compiled the code successfully.")

**Failed response**

```json
{
  "status": "error",
  "summary": "Lean kodu derlenemedi. İpucu: bilinmeyen bir isim kullanıldı; doğru lemma/sabit adını `#check` veya `lean-explore` ile doğrulayın.",
  "diagnostics": ["3:11: error: Unknown constant `Nat.succcccc`"]
}
```

(`summary` reads: "Lean could not compile the code. Hint: an unknown name was
used; verify the correct lemma/constant name with `#check` or `lean-explore`.")

The `summary` and hint strings above are the exact text `src/lean.ts` produces
in the current build; they are quoted verbatim. The compiler messages in
`diagnostics` come from Lean itself. `status` is only ever `success` or `error`.
Success is decided by whether the code actually compiles; the model's own
assessment is not used (`src/lean.ts`).

**`isError` semantics.** The tool is marked `isError: true` only when the *tool*
fails: the Lean toolchain is missing or the compilation times out. The compiler
rejecting the code is the normal, expected outcome and is returned as
`isError: false` with `status: "error"`. The model then treats each failed
attempt as a compiler verdict to iterate on, not as a tool failure
(`src/index.ts`).

**Information and warning messages.** Messages other than `severity: "error"`
reach the model in `diagnostics`. This covers `#check` / `#print` / `#eval`
output (for example `#check Nat.add_comm` gives
`Nat.add_comm (n m : Nat) : n + m = m + n`) and the
``declaration uses `sorry` `` warning. A file containing `sorry` compiles
(`status: "success"`) but the `summary` says so, so an empty proof is not taken
as finished (`src/lean.ts`).

**Failure hints.** When compilation fails, the `summary` carries a one-line hint
keyed to the failure class (for example `unsolved goals` gets a tactic
suggestion; `unknown identifier` means verify the name with `#check` or
`lean-explore`; a syntax error means check the notation). Warning and information
messages that accompany the
error are kept in `diagnostics`, so the model gets maximum context from a single
attempt (`src/lean.ts`).

### Configuration

| Variable | Default | Description |
|---|---|---|
| `LEAN_MCP_PROJECT_DIR` | `./lean-project` | Directory of the Lake project to elaborate against |
| `LEAN_MCP_TIMEOUT_MS` | `180000` | Time limit for a single compilation attempt |
| `LEAN_MCP_MAX_OUTPUT_BYTES` | `262144` | Upper bound on captured compiler output |
| `ELAN_HOME` | `~/.elan` | elan installation directory; its `bin` is added to `PATH` |

### Design notes

- **JSON output parsing.** Snippets are compiled with `lake env lean --json`.
  Lean's JSON messages parse reliably; the receiver treats the proof as failed
  when any message has `severity: "error"`. If only warnings and information
  are present the code is considered compiled, and the warnings are returned in
  `diagnostics` (`src/lean.ts`).
- **Serial execution.** Concurrent tool calls run through a queue, so every call
  gets its own unique temporary file and scratch files do not interleave
  (`src/lean.ts`).
- **Timeout.** `simp`, `decide` and `norm_num` calls can run forever. On timeout
  the process group is stopped with SIGTERM and then SIGKILL, and the model gets
  an `error` with a simplification suggestion (`src/lean.ts`, `src/config.ts`).
- **Temporary files.** Snippets are written under `.lean-mcp-tmp/` inside the
  project (so Mathlib is on Lean's `LEAN_PATH`) and removed after every call. On
  startup the server clears `Check_*.lean` files left by a previous crash
  (`src/lean.ts`).

### Operational notes

- **Clean shutdown.** On SIGTERM / SIGINT / SIGHUP or a closed stdio connection
  the server terminates every in-flight compilation together with its process
  group (server, then `lake`, then `lean`) and exits immediately. This prevents a stuck
  tactic from continuing as an orphan process after the server dies. Operational
  messages go only to stderr; stdout is reserved for the MCP protocol
  (`src/index.ts`, `src/lean.ts`).
- **Startup check.** On start the server checks that `LEAN_MCP_PROJECT_DIR`
  exists and that `lake` is reachable; it prints a warning to stderr when
  something is wrong (it does not stop; every call returns a structured error)
  (`src/index.ts`).
- **Configuration errors are returned structurally.** When the project directory
  is missing or not writable, `lean_check` returns
  `{"status":"error","summary":"Lean çalıştırılamadı.","diagnostics":[...]}`
  with `isError: true`, and the cause and project directory appear in
  `diagnostics` (`src/lean.ts`).
- **Security note.** This server runs **every Lean snippet** supplied by the
  model or the calling client on the local machine; `#eval` executes arbitrary
  computation. Expose it only to a trusted party (a trusted model provider), and
  not to remote or anonymous clients (`src/lean.ts`).
- **Rebuild.** After `npm run build`, a running MCP process keeps the previous
  code in memory; restart the server (or reconnect the MCP connection in your
  client) for changes to take effect.

## Status

Lean 4.34.1 and Mathlib v4.34.1 are installed and the cache has been fetched
(`lean-project/lean-toolchain`, `lean-project/lakefile.lean`).

Verified behaviors:

- Tool contract: only `lean_check`, only a `code` input, only
  `status` / `summary` / `diagnostics` in the output (`scripts/smoke.mjs`,
  `scripts/smoke-call.mjs`).
- A real compiler error is returned in `diagnostics` with its exact text (for
  example `2:29: error: unsolved goals ⊢ False`) (`src/test/integration.test.ts`).
- With `import Mathlib`, tactics such as `norm_num` and `omega` work
  (`src/test/integration.test.ts`).
- `theorem x : P := by sorry` compiles (Lean exit code 0) but the
  ``declaration uses `sorry` `` warning is passed to the model in `diagnostics`
  and the `summary` states that the proof is unfinished; a hollow proof does not
  look finished (`src/lean.ts`, `src/test/integration.test.ts`).
- `information`-level output such as `#check` / `#print` / `#eval` is returned
  in `diagnostics`, so the model can query lemma statements
  (`src/lean.ts`, `src/test/integration.test.ts`).
- A wrong proof returns `status: "error"` with `isError: false` (the tool ran,
  the code did not compile); `isError: true` appears only when the toolchain is
  missing or a check times out (`src/index.ts`, `src/lean.ts`).
- A timeout never locks up the server; the process is terminated and the model
  is advised to simplify (`scripts/robustness.mjs`).
- Concurrent calls are serialized and no scratch files leak
  (`scripts/stress.mjs`, `src/test/integration.test.ts`).
- The same snippet with and without Mathlib tactics gives different results,
  proving the import path really works (`src/test/integration.test.ts`).

Not done yet (out of scope for this pass): wiring into an OpenCode
configuration and an end-to-end model trial through OpenChamber.

## Development

```bash
npm run build          # compile TypeScript
npm test               # parser unit tests (do not need Lean)
npm run check          # tsc + unit tests + smoke (fast CI)
npm run test:all       # check + integration + smoke:call + stress + robustness
npm run test:integration   # tests against the real compiler
npm run smoke          # stdio handshake and tool schema check
npm run smoke:call     # end-to-end verification of a tool call
npm run smoke:stress   # concurrent calls and scratch-file leak check
npm run robustness     # production behaviors: broken project dir, process-tree
                       # cleanup during SIGTERM, timeout regression
```

Integration tests skip themselves automatically when `lake` is not on `PATH`.
They also check whether Mathlib has been built; if
`.lake/packages/mathlib` has not been fetched, that single test is skipped
(`src/test/integration.test.ts`).

## License

GPL-3.0-only. If you modify and distribute this repository, your derivative work
must also be licensed under GPL-3.0. See the [LICENSE](LICENSE) file for the full
source text.

Lean, Mathlib and the MCP SDK are out of scope; they are distributed under their
own licenses.

# Graph Report - lean-mcp  (2026-10-14)

## Corpus Check
- 39 files · ~12,861 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .lean 2)

## Summary
- 319 nodes · 377 edges · 31 communities (20 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dfe6c8ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- lean.ts
- robustness.mjs
- lean_check Tool
- package.json
- compilerOptions
- Final Report: <title>
- graphify Knowledge Graph
- ADR-<NNN>: <decision title>
- PRD: <title>
- Causes by Category
- SPEC Delta: <capability>
- Consultant Onboard
- De Bono Six Thinking Hats: <proposal>
- Pre-Mortem: <project>
- Wardley Map: <project>
- MECE Analysis: <topic>
- Red Team Review: <plan>
- Project: <project_name>
- Project: lean-mcp
- FMEA: <plan or feature>
- Archive Tool
- De Bono Tool
- Document Tool
- FMEA Tool
- Ishikawa Tool
- MECE Tool
- Pre-Mortem Tool
- Red Team Tool
- Report Tool
- Wardley Tool
- README.md

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `lean_check Tool` - 13 edges
3. `scripts` - 12 edges
4. `LeanChecker` - 11 edges
5. `PRD: <title>` - 11 edges
6. `ADR-<NNN>: <decision title>` - 9 edges
7. `Consultant Onboard` - 9 edges
8. `Final Report: <title>` - 9 edges
9. `leanEnv()` - 8 edges
10. `De Bono Six Thinking Hats: <proposal>` - 8 edges

## Surprising Connections (you probably didn't know these)
- `graphify query Command` --semantically_similar_to--> `lean-explore Hosted MCP`  [INFERRED] [semantically similar]
  AGENTS.md → README.md
- `lakePresent()` --calls--> `leanEnv()`  [EXTRACTED]
  src/test/integration.test.ts → src/config.ts
- `warnAboutEnvironment()` --calls--> `leanEnv()`  [EXTRACTED]
  src/index.ts → src/config.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **lean_check Compilation Design Notes** — readme_json_output_parsing, readme_serial_execution, readme_timeout_handling, readme_temp_files [INFERRED 0.85]
- **lean_check Result Contract (status/summary/diagnostics)** — readme_lean_check, readme_diagnostics, readme_iserror_semantics, readme_error_hints [INFERRED 0.85]
- **Server Operational Behavior Notes** — readme_graceful_shutdown, readme_startup_check, readme_structured_config_errors, readme_rebuild_restart [INFERRED 0.85]

## Communities (31 total, 11 thin omitted)

### Community 0 - "lean.ts"
Cohesion: 0.08
Nodes (26): zod, checkTimeoutMs, elanBinCandidates(), here, killGraceMs, leanEnv(), leanProjectDir, maxOutputBytes (+18 more)

### Community 1 - "robustness.mjs"
Cohesion: 0.10
Nodes (15): @modelcontextprotocol/sdk, findChild(), walk(), root, SERVER, client, root, transport (+7 more)

### Community 2 - "lean_check Tool"
Cohesion: 0.12
Nodes (15): diagnostics Field, elan Toolchain Manager, ELAN_HOME, Error Hints in Summary, Information-Level Output (#check/#print/#eval), Lake Build Tool, lean_check Tool, lean-explore Hosted MCP (+7 more)

### Community 3 - "package.json"
Cohesion: 0.06
Nodes (30): bin, lean-mcp, dependencies, @modelcontextprotocol/sdk, zod, description, devDependencies, @types/node (+22 more)

### Community 4 - "compilerOptions"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noImplicitOverride (+9 more)

### Community 5 - "Final Report: <title>"
Cohesion: 0.12
Nodes (16): Analysis Results, De Bono, Decision, Executive Summary, Final Report: <title>, FMEA, Ishikawa, MECE (+8 more)

### Community 6 - "graphify Knowledge Graph"
Cohesion: 0.26
Nodes (9): graphify-out/graph.json, graphify-out/GRAPH_REPORT.md, graphify Knowledge Graph, graphify explain Command, graphify path Command, graphify query Command, graphify Skill / Instructions, graphify update Command (+1 more)

### Community 7 - "ADR-<NNN>: <decision title>"
Cohesion: 0.13
Nodes (14): ADR-<NNN>: <decision title>, ADR-<NNN>: <next decision title>, ADR Set: <title>, Confirmation, Considered Options, Context and Problem Statement, Decision Drivers, Decision Outcome (+6 more)

### Community 8 - "PRD: <title>"
Cohesion: 0.14
Nodes (13): 10. Source Analysis, 1. Problem, 2. Goals, 3. Non-Goals, 4. Users and Use Cases, 5.1 Functional, 5.2 Non-Functional, 5. Requirements (+5 more)

### Community 9 - "Causes by Category"
Cohesion: 0.15
Nodes (12): Causes by Category, Conclusion, Data, Environment, Five-Why Chains, Ishikawa Analysis: <problem>, People, Problem (Effect) (+4 more)

### Community 10 - "SPEC Delta: <capability>"
Cohesion: 0.20
Nodes (9): ADDED Requirements, MODIFIED Requirements, REMOVED Requirements, Requirement: <existing name>, Requirement: <existing name>, Requirement: <name>, Scenario: <name>, Scenario: <name> (+1 more)

### Community 11 - "Consultant Onboard"
Cohesion: 0.20
Nodes (9): Consultant Onboard, Finish, Rules, Stage guide, Step 1: Check the project root, Step 2: Choose a change, Step 3a: New change, Step 3b: Continue a change (+1 more)

### Community 12 - "De Bono Six Thinking Hats: <proposal>"
Cohesion: 0.22
Nodes (8): Black Hat: Caution, Blue Hat: Process, De Bono Six Thinking Hats: <proposal>, Green Hat: Creativity, Proposal, Red Hat: Feelings, White Hat: Facts, Yellow Hat: Benefits

### Community 13 - "Pre-Mortem: <project>"
Cohesion: 0.29
Nodes (6): Failure Statement, Failure Stories, Pre-Mortem: <project>, Story 1: <title>, Story 2: <title>, Summary of Mitigations

### Community 14 - "Wardley Map: <project>"
Cohesion: 0.29
Nodes (6): Components, Conclusion, Skill and Resource Gaps, Strategic Moves, User Needs, Wardley Map: <project>

### Community 15 - "MECE Analysis: <topic>"
Cohesion: 0.33
Nodes (5): Branches, Conclusion, Coverage Check, MECE Analysis: <topic>, Overlap Check

### Community 16 - "Red Team Review: <plan>"
Cohesion: 0.33
Nodes (5): Assumptions, Plan Summary, Red Team Review: <plan>, Verdict, Weakest Points

### Community 17 - "Project: <project_name>"
Cohesion: 0.40
Nodes (4): Changelog, Decisions, Project: <project_name>, Requirements

### Community 18 - "Project: lean-mcp"
Cohesion: 0.40
Nodes (4): Changelog, Decisions, Project: lean-mcp, Requirements

### Community 19 - "FMEA: <plan or feature>"
Cohesion: 0.50
Nodes (3): Failure Modes (sorted by RPN, highest first), FMEA: <plan or feature>, Top Risks

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `typescript`, `ELAN_HOME`, `Information-Level Output (#check/#print/#eval)`, `LEAN_MCP_MAX_OUTPUT_BYTES` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 200 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@modelcontextprotocol/sdk` connect `robustness.mjs` to `lean.ts`, `package.json`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **What connects `@types/node`, `typescript`, `ELAN_HOME` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `lean.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08484848484848485 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `lean.ts` to `package.json`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Should `robustness.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._
- **Should `lean_check Tool` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._
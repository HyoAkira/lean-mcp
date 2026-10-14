# Graph Report - lean-mcp  (2026-10-13)

## Corpus Check
- Corpus is ~7,165 words - fits in a single context window. You may not need a graph.

## Summary
- 158 nodes · 241 edges · 8 communities
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Lean Checker Core and Config
- Smoke and Stress Scripts
- README Concepts and Rationale
- Package Metadata and Dependencies
- TypeScript Compiler Config
- MCP Server Lifecycle
- Graphify Workflow Docs
- NPM Build Scripts

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 15 edges
2. `lean_check Tool` - 13 edges
3. `scripts` - 12 edges
4. `LeanChecker` - 11 edges
5. `leanEnv()` - 8 edges
6. `graphify Knowledge Graph` - 7 edges
7. `@modelcontextprotocol/sdk` - 6 edges
8. `Lean MCP Server` - 6 edges
9. `diagnostics Field` - 6 edges
10. `leanProjectDir` - 5 edges

## Surprising Connections (you probably didn't know these)
- `graphify query Command` --semantically_similar_to--> `lean-explore Hosted MCP`  [INFERRED] [semantically similar]
  AGENTS.md → README.md
- `warnAboutEnvironment()` --calls--> `leanEnv()`  [EXTRACTED]
  src/index.ts → src/config.ts
- `lakePresent()` --calls--> `leanEnv()`  [EXTRACTED]
  src/test/integration.test.ts → src/config.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **lean_check Compilation Design Notes** — readme_json_output_parsing, readme_serial_execution, readme_timeout_handling, readme_temp_files [INFERRED 0.85]
- **Server Operational Behavior Notes** — readme_graceful_shutdown, readme_startup_check, readme_structured_config_errors, readme_rebuild_restart [INFERRED 0.85]
- **lean_check Result Contract (status/summary/diagnostics)** — readme_lean_check, readme_diagnostics, readme_iserror_semantics, readme_error_hints [INFERRED 0.85]

## Communities (8 total, 0 thin omitted)

### Community 0 - "Lean Checker Core and Config"
Cohesion: 0.12
Nodes (18): checkTimeoutMs, elanBinCandidates(), here, killGraceMs, leanEnv(), leanProjectDir, maxOutputBytes, packageRoot (+10 more)

### Community 1 - "Smoke and Stress Scripts"
Cohesion: 0.10
Nodes (15): @modelcontextprotocol/sdk, findChild(), walk(), root, SERVER, client, root, transport (+7 more)

### Community 2 - "README Concepts and Rationale"
Cohesion: 0.12
Nodes (15): diagnostics Field, elan Toolchain Manager, ELAN_HOME, Error Hints in Summary, Information-Level Output (#check/#print/#eval), Lake Build Tool, lean_check Tool, lean-explore Hosted MCP (+7 more)

### Community 3 - "Package Metadata and Dependencies"
Cohesion: 0.11
Nodes (18): bin, lean-mcp, dependencies, @modelcontextprotocol/sdk, zod, description, devDependencies, @types/node (+10 more)

### Community 4 - "TypeScript Compiler Config"
Cohesion: 0.11
Nodes (17): compilerOptions, declaration, esModuleInterop, forceConsistentCasingInFileNames, lib, module, moduleResolution, noImplicitOverride (+9 more)

### Community 5 - "MCP Server Lifecycle"
Cohesion: 0.21
Nodes (7): checker, main(), server, shutdown(), warnAboutEnvironment(), killTree(), LeanChecker

### Community 6 - "Graphify Workflow Docs"
Cohesion: 0.26
Nodes (9): graphify-out/graph.json, graphify-out/GRAPH_REPORT.md, graphify Knowledge Graph, graphify explain Command, graphify path Command, graphify query Command, graphify Skill / Instructions, graphify update Command (+1 more)

### Community 7 - "NPM Build Scripts"
Cohesion: 0.17
Nodes (12): scripts, build, check, dev, robustness, smoke, smoke:call, smoke:stress (+4 more)

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `typescript`, `LEAN_MCP_TIMEOUT_MS`, `LEAN_MCP_MAX_OUTPUT_BYTES`, `ELAN_HOME` (+2 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 75 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@modelcontextprotocol/sdk` connect `Smoke and Stress Scripts` to `Package Metadata and Dependencies`, `MCP Server Lifecycle`?**
  _High betweenness centrality (0.134) - this node is a cross-community bridge._
- **What connects `@types/node`, `typescript`, `LEAN_MCP_TIMEOUT_MS` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Lean Checker Core and Config` be split into smaller, more focused modules?**
  _Cohesion score 0.12315270935960591 - nodes in this community are weakly interconnected._
- **Why does `scripts` connect `NPM Build Scripts` to `Package Metadata and Dependencies`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Should `Smoke and Stress Scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.09971509971509972 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `Package Metadata and Dependencies` to `MCP Server Lifecycle`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Should `README Concepts and Rationale` be split into smaller, more focused modules?**
  _Cohesion score 0.12307692307692308 - nodes in this community are weakly interconnected._
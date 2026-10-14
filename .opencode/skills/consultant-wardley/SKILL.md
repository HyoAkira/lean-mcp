---
name: consultant-wardley
description: Wardley mapping tool for the Consultant framework. Places user needs and components on an evolution axis and proposes strategic moves. Use from consultant-onboard or when the user asks for Wardley mapping, value chain, or build versus buy analysis.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# Wardley Tool

A Wardley map links user needs to the components that serve them. Each
component has a visibility (how close to the user) and an evolution stage:
Genesis, Custom, Product, or Commodity. The map shows which components to
build, buy, or differentiate.

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. If `tools.wardley.status` is `running`, ask the user whether to reset it.
3. Read `ProjectDocs/project.md` and any `done` output in the change folder.
   Use MECE and De Bono output if they exist.
4. Set `tools.wardley.status` to `running`. Leave the version.
5. Read `templates/wardley.md`.
6. Ask the user for the project's user needs. Ask for the components that
   serve them. Ask questions one at a time.
7. For each component, set visibility from 1 (user-facing) to 5 (hidden),
   and set its evolution stage. Explain each stage choice in one sentence.
8. Record dependencies between components.
9. Write strategic moves: build, buy, partner, or differentiate. Tie each
   move to a component and a reason.
10. Note skill and resource gaps that the map reveals.
11. Write `ProjectDocs/changes/<slug>/WARDLEY-v<n>.md`, where n = version + 1.
12. Read the file back. Confirm the sections exist.
13. Set `tools.wardley` to `done`, the new version, and the file name.
14. Show a short summary. Name the next recommended tool. Stop.

If a write fails, set the status back to `not_run` and report the error.

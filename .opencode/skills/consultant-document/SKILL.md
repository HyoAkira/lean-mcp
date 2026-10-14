---
name: consultant-document
description: Creates the PRD, ADR, or SPEC document for a Consultant change. Takes one argument, type, which is prd, adr, or spec. Use from consultant-onboard or when the user asks for a PRD, an ADR, or a spec for a change.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# Document Tool

This skill writes one of three documents for a change. The argument `type`
selects the document: `prd`, `adr`, or `spec`.

| Type | File | Template | Needs |
|---|---|---|---|
| prd | `PRD-v<n>.md` | `templates/prd.md` | MECE, Red Team (recommended) |
| adr | `ADR-v<n>.md` | `templates/adr.md` | PRD. One file can hold several decision records. |
| spec | `SPEC-v<n>.md` | `templates/spec.md` | PRD, FMEA (recommended) |

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. Confirm the `type` argument is `prd`, `adr`, or `spec`. If not, ask.
3. Check the prerequisites in the table. If a prerequisite is missing,
   tell the user which one, and ask whether to continue.
4. If `documents.<type>.status` is `running`, ask the user whether to reset it.
5. Read every `done` tool output in the change folder. Read the PRD if the
   type is `adr` or `spec`. Read `ProjectDocs/project.md`.
6. Set `documents.<type>.status` to `running`. Leave the version.
7. Read `templates/<type>.md`.
8. Ask the user for the facts the document needs. Ask questions one at a time. Use the tool outputs first, so the user answers
   only what is missing.
9. Draft the document using the template. Do not copy analysis text
   without checking it against the user's answers.
10. Show the draft in full. Ask the user to approve it or request changes.
    Revise until the user approves.
11. Write `ProjectDocs/changes/<slug>/<FILE>-v<n>.md`, where n = version + 1.
12. Read the file back. Confirm the sections exist.
13. Set `documents.<type>` to `done`, the new version, and the file name.
14. For `spec`: the file is a delta. It uses ADDED, MODIFIED, and REMOVED
    sections. Check that each requirement name is unique within the file.
15. Show a short summary. Name the next recommended step. Stop.

If a write fails, set the status back to `not_run` and report the error.

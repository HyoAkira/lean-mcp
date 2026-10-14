---
name: consultant-report
description: Creates the final consolidated report for a Consultant change. Combines all tool outputs and documents into one report. Use when the user asks for the final report, or from consultant-onboard when all tools and documents are done.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# Report Tool

The report combines every tool output and document of one change into a
single file. It runs only when all seven tools are done.

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. Check that all seven tools have `status: done`. If any tool is not done,
   stop and list the tools that are not done. Do not write the report.
3. If `report.status` is `running`, ask the user whether to reset it.
4. Set `report.status` to `running`. Leave the version.
5. Read `templates/report.md`.
6. Read every output file named in change.yaml.
7. Write the report. Use one section per input. Do not add facts that are
   not in the inputs. If inputs conflict, list the conflict in the
   Open Issues section. Do not choose a side.
8. Write `ProjectDocs/changes/<slug>/REPORT-v<n>.md`, where n = version + 1.
9. Read the file back. Confirm the sections exist.
10. Set `report` to `done`, the new version, and the file name.
11. Show a short summary. Name the next step: `consultant-archive`. Stop.

If a write fails, set the status back to `not_run` and report the error.

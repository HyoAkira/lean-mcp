---
name: consultant-premortem
description: Pre-mortem tool for the Consultant framework. Assumes the project has already failed and writes plausible failure stories with warning signs and mitigations. Use from consultant-onboard or when the user asks for a pre-mortem or failure analysis before work starts.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# Pre-Mortem Tool

A pre-mortem starts from a failed outcome. The project has failed at its
target date. The task is to explain why. Each failure story needs a cause,
a warning sign, and a mitigation.

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. If `tools.premortem.status` is `running`, ask the user whether to reset it.
3. Read `ProjectDocs/project.md` and any `done` output in the change folder.
   Use Red Team and MECE output if they exist.
4. Set `tools.premortem.status` to `running`. Leave the version.
5. Read `templates/premortem.md`.
6. Ask the user for the target date and the definition of failure. Ask questions one at a time.
7. State the failure: "It is <target date>. The project has failed. The
   reason is not yet known."
8. Write failure stories. Each story must be plausible and
   specific to this project.
9. For each story, record:
   - Cause
   - Early warning sign that can be observed before the failure
   - Mitigation
   - Owner, if the user names one
10. Write `ProjectDocs/changes/<slug>/PREMORTEM-v<n>.md`, where n = version + 1.
11. Read the file back. Confirm the sections exist.
12. Set `tools.premortem` to `done`, the new version, and the file name.
13. Show a short summary. Name the next recommended tool. Stop.

If a write fails, set the status back to `not_run` and report the error.

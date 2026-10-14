---
name: consultant-red-team
description: Red team tool for the Consultant framework. Attacks the assumptions of a plan and tests whether they hold. Use from consultant-onboard or when the user asks for red teaming, assumption testing, or a devil's advocate review.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# Red Team Tool

Red teaming finds the assumptions a plan depends on. It argues that each
one is false. It names the evidence that would prove it false. It ranks
the damage if the assumption is wrong.

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. If `tools.red_team.status` is `running`, ask the user whether to reset it.
3. Read `ProjectDocs/project.md` and any `done` output in the change folder.
   Use MECE and Ishikawa output if they exist.
4. Set `tools.red_team.status` to `running`. Leave the version.
5. Read `templates/red-team.md`.
6. Ask the user for the plan or proposal. Then ask for the assumptions the
   plan depends on. If the user cannot list them, propose assumptions from
   the earlier outputs and mark them `Proposed`. Ask questions one at a time.
7. For each assumption, write:
   - The attack: the strongest argument that it is false
   - The disproof: the evidence that would show it is false
   - The impact if false: High, Medium, or Low
8. Name the weakest points of the plan.
9. Write a verdict: which assumptions, if false, break the plan.
10. Write `ProjectDocs/changes/<slug>/RED-TEAM-v<n>.md`, where n = version + 1.
11. Read the file back. Confirm the sections exist.
12. Set `tools.red_team` to `done`, the new version, and the file name.
13. Show a short summary. Name the next recommended tool. Stop.

If a write fails, set the status back to `not_run` and report the error.

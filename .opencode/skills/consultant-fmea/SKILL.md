---
name: consultant-fmea
description: FMEA (failure mode and effects analysis) tool for the Consultant framework. Turns problems from Ishikawa, Red Team, and Pre-Mortem into scored failure modes with a risk priority number. Use from consultant-onboard or when the user asks for FMEA or risk scoring.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# FMEA Tool

FMEA turns problems into numbers. Each failure mode gets three scores from 1
to 10. A higher score is worse:

- Severity (S): the size of the effect.
- Occurrence (O): how often the cause happens.
- Detection (D): how hard the failure is to detect in time.

Risk priority number: RPN = S x O x D.

The main input is the problems found by Ishikawa, Red Team, and Pre-Mortem.
The user may add more.

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. If `tools.fmea.status` is `running`, ask the user whether to reset it.
3. Read `ProjectDocs/project.md` and any `done` output in the change folder.
   Read the Ishikawa, Red Team, and Pre-Mortem outputs first.
4. Set `tools.fmea.status` to `running`. Leave the version.
5. Read `templates/fmea.md`.
6. List the failure modes from those outputs. Ask the user for any more.
   Ask questions one at a time.
7. For each failure mode, record the effect, the cause, the current control,
   and the source finding.
8. Score S, O, and D from 1 to 10. Mark each score as `Confirmed` if the user
   gave it, or `Estimated` if you set it. Ask the user to confirm estimates.
9. Calculate RPN = S x O x D. Sort the table by RPN, highest first.
10. Write `ProjectDocs/changes/<slug>/FMEA-v<n>.md`, where n = version + 1.
11. Read the file back. Confirm the table exists.
12. Set `tools.fmea` to `done`, the new version, and the file name.
13. Show a short summary with the top three RPN rows. Name the next
    recommended tool. Stop.

If a write fails, set the status back to `not_run` and report the error.

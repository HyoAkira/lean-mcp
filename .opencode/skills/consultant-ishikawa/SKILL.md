---
name: consultant-ishikawa
description: Ishikawa (fishbone) root cause analysis tool for the Consultant framework. Groups possible causes of a problem into categories and tests candidate root causes. Use from consultant-onboard or when the user asks for fishbone, Ishikawa, or root cause analysis.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# Ishikawa Tool

Ishikawa analysis states one problem as an effect. It lists possible causes
in categories. It tests each cause to find root causes.

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. If `tools.ishikawa.status` is `running`, ask the user whether to reset it.
3. Read `ProjectDocs/project.md` and any `done` output in the change folder.
4. Set `tools.ishikawa.status` to `running`. Leave the version.
5. Read `templates/ishikawa.md`.
6. Ask the user to state the problem as one effect, in one sentence. Ask
   for the most important facts about it. Ask questions one at a time.
7. Use these categories. Change them only if the project needs it, and
   note the change in the output:
   - People
   - Process
   - Tools and Technology
   - Data
   - Environment
   - Requirements
8. For each category, ask for possible causes. Add causes the user gives.
   Do not add causes the user did not mention without marking them as
   `Proposed`.
9. For each cause, ask "Why?" three to five times. Record the chain.
10. Mark the last cause in each chain as a root cause candidate. Mark it
    `Confirmed` only if the user gives evidence.
11. Write `ProjectDocs/changes/<slug>/ISHIKAWA-v<n>.md`, where n = version + 1.
12. Read the file back. Confirm the sections exist.
13. Set `tools.ishikawa` to `done`, the new version, and the file name.
14. Show a short summary. Name the next recommended tool. Stop.

If a write fails, set the status back to `not_run` and report the error.

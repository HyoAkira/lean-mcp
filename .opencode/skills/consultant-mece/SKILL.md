---
name: consultant-mece
description: MECE analysis tool for the Consultant framework. Splits a topic into branches that do not overlap and cover everything. Use from consultant-onboard or when the user asks for MECE, mutually exclusive collectively exhaustive, or structured decomposition.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# MECE Tool

MECE means mutually exclusive, collectively exhaustive. Each branch must
differ from the others. All branches together must cover the whole topic.

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. If `tools.mece.status` is `running`, ask the user whether to reset it.
3. Read `ProjectDocs/project.md` and any `done` output in the change folder.
4. Set `tools.mece.status` to `running` in change.yaml. Leave the version.
5. Read `templates/mece.md`.
6. Ask the user for the topic and the split criteria. Ask questions one at a time. Mark unknown items as `Unknown`.
7. Build 3 to 7 branches. Each branch needs one clear criterion.
8. Check overlap: compare each pair of branches. Move shared items to one
   branch and note the change.
9. Check coverage: ask "Is there any item that fits no branch?" Add a
   branch or note the gap.
10. Write `ProjectDocs/changes/<slug>/MECE-v<n>.md`, where n = version + 1.
    Use the template.
11. Read the file back. Confirm the sections exist.
12. Set `tools.mece` to `done`, the new version, and the file name.
13. Show a short summary. Name the next recommended tool. Stop.

If a write fails, set the status back to `not_run` and report the error.

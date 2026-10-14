---
name: consultant-de-bono
description: De Bono six thinking hats tool for the Consultant framework. Reviews a proposal from six fixed viewpoints, one at a time. Use from consultant-onboard or when the user asks for six hats, De Bono, or structured parallel thinking.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# De Bono Tool

Six thinking hats review one proposal from six modes. Each hat has one
mode. Run the hats in the fixed order below. Do not mix modes inside a hat.

| Hat | Mode | Question |
|---|---|---|
| White | Facts | What facts do we know? What data is missing? |
| Red | Feelings | What is the gut reaction? Which concerns are emotional? |
| Black | Caution | What could go wrong? What are the risks? |
| Yellow | Benefits | What value does this create? Why could it work? |
| Green | Creativity | What other options exist? |
| Blue | Process | What is the summary? What is the next step? |

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. If `tools.de_bono.status` is `running`, ask the user whether to reset it.
3. Read `ProjectDocs/project.md` and any `done` output in the change folder.
4. Set `tools.de_bono.status` to `running`. Leave the version.
5. Read `templates/de-bono.md`.
6. Ask the user to state the proposal in two to three sentences.
7. Run the hats in order. For each hat, ask the user for input when
   needed. Keep the answers inside that hat's mode. If the user gives an
   answer for a different hat, record it under the correct hat.
8. Write `ProjectDocs/changes/<slug>/DE-BONO-v<n>.md`, where n = version + 1.
9. Read the file back. Confirm all six hat sections exist.
10. Set `tools.de_bono` to `done`, the new version, and the file name.
11. Show a short summary. Name the next recommended tool. Stop.

If a write fails, set the status back to `not_run` and report the error.

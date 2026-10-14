---
name: consultant-onboard
description: Entry point for the Consultant framework. Use to start a project, open a new change, or continue an existing change. Also use when the user says "consultant onboard" or runs /consultant-onboard.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# Consultant Onboard

This is the only entry command. It creates the project root, opens new
changes, and continues existing changes. It routes the user to the right
tool, document, report, or archive skill.

## Rules

- Write all documents in English.
- Do not edit project code. This framework writes documents only.
- Ask before you overwrite any file.
- Stop after each output file. Show what you wrote. Wait for the user.
- Use the user's own words for their project. Do not invent facts.

## Step 1: Check the project root

1. Check whether `ProjectDocs/config.yaml` exists.
2. If it does not exist, create the structure automatically:
   1. Run `basename "$(pwd)"`. Use the result as `<project_name>`.
   2. Run `date +%Y-%m-%d`. Use the result as `<date>`.
   3. Create the folders `ProjectDocs/changes/` and `ProjectDocs/archive/`.
   4. Create `ProjectDocs/config.yaml` from `templates/config.yaml`.
      Replace `<project_name>`.
   5. Create `ProjectDocs/project.md` from `templates/project.md`.
      Replace `<project_name>` and `<date>`.
   Do not ask the user for the project name.
3. If it exists, read it. Use its `changes_dir`, `archive_dir`,
   and `project_file` values. Do not assume the defaults.

## Step 2: Choose a change

1. List the folders in `ProjectDocs/changes/`.
2. Show the options:
   - `New change`
   - Each existing change, with the number of `done` tools and documents
3. Ask the user to choose one.

## Step 3a: New change

1. Ask for a short description of the change.
2. Suggest a kebab-case slug from the description. Ask the user to confirm
   or change it.
3. Check that `ProjectDocs/changes/<slug>/` does not exist. If it exists,
   stop and ask the user to choose another slug or continue that change.
4. Get today's date with `date +%Y-%m-%d`.
5. Create `ProjectDocs/changes/<slug>/change.yaml` from
   `templates/change.yaml`. Replace `<slug>`, `<description>`, and
   `<date>`.
6. Show the stage guide below. Recommend the tools for Stage 1.

## Step 3b: Continue a change

1. Read `ProjectDocs/changes/<slug>/change.yaml`.
2. If any tool or document has `status: running`, the last run did not
   finish. Ask the user:
   - `Reset and run again` sets the status to `not_run`.
   - `Keep as is` leaves it unchanged. Do not start a new run on it.
3. Find the lowest stage that still has a `not_run` tool. Recommend the
   `not_run` tools of that stage.
4. List the documents that are not `done`.
5. The user may choose any tool or document, in any order. Accept the
   choice. Do not block it.

## Step 4: Run the chosen item

Follow the `SKILL.md` of the chosen skill now. Use these names:

| Item | Skill |
|---|---|
| Tool | `consultant-mece`, `consultant-ishikawa`, `consultant-de-bono`, `consultant-red-team`, `consultant-wardley`, `consultant-premortem`, `consultant-fmea` |
| Document | `consultant-document` with type `prd`, `adr`, or `spec` |
| Report | `consultant-report` |
| Archive | `consultant-archive` |

## Stage guide

Tools per stage. The user may run them in any order.

| Stage | Purpose | Tools |
|---|---|---|
| 1. Project justification | Split the problem, find root causes, test benefit claims | MECE, Red Team, Ishikawa, De Bono |
| 2. Existing solutions and differentiation | Compare options, test differentiation, assess strategic risk | MECE, Wardley, Red Team, De Bono, Pre-Mortem, Ishikawa, FMEA |
| 3. Scope and success criteria | Define scope and success, find likely failures | MECE, Red Team, De Bono, Pre-Mortem, Ishikawa, FMEA |
| 4. Knowledge, resources, constraints | Find skill gaps, resource limits, and their risks | Wardley, MECE, Red Team, De Bono, Pre-Mortem, Ishikawa, FMEA |
| 5. Roadmap and feasibility | Challenge the plan, find failure paths, rank risks | MECE, Wardley, Red Team, Pre-Mortem, Ishikawa, FMEA, De Bono |
| 6. Requirements | Find gaps in requirements, define risk-reducing requirements | MECE, De Bono, Red Team, Pre-Mortem, Ishikawa, FMEA |
| 7. Holistic review | Check consistency, scope coverage, risk handling | All seven tools |

## Finish

Show the status of the change: tools, documents, report. Name the next
recommended item. Stop.

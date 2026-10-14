---
name: consultant-archive
description: Archives a Consultant change. Applies the change's SPEC delta and records its ADR decisions in ProjectDocs/project.md, then moves the change folder to archive. Use when the user asks to archive a change.
license: Proprietary
metadata:
  author: Umut Can AKÇAY
  version: "1.0"
---

# Archive Tool

Archiving applies the change's SPEC delta to the main requirements in
`ProjectDocs/project.md`. It records the ADR decisions. Then it moves the
change folder to the archive.

## Procedure

1. Read `ProjectDocs/config.yaml` and `ProjectDocs/changes/<slug>/change.yaml`.
   If the slug is not clear, ask the user which change to use.
2. Check that all seven tools and the report have `status: done`. If any of
   them is not done, stop and list what is not done. Do not write any file.
3. Read `ProjectDocs/project.md`, `SPEC-v<n>.md`, and `ADR-v<n>.md` for this
   change. The SPEC file is required. The ADR file is used if it exists.
4. Build the new `project.md` in memory:
   - ADDED: append each requirement block and its scenarios.
   - MODIFIED: replace the matching requirement block with the new block.
   - REMOVED: delete the matching requirement block.
   - Decisions table: add one row for each decision record in the ADR file,
     with its ID, title, status, and source change.
   - Changelog: add one row with the date, the slug, the spec version, and
     the ADR IDs.
   - Update `Last updated`.
   Keep all other content unchanged.
5. If a MODIFIED or REMOVED name is not in the main requirements:
   1. List the other active changes in `ProjectDocs/changes/`, excluding
      this one.
   2. Read the `SPEC-v<n>.md` file of each active change. Use the file named
      in its `change.yaml`.
   3. Check whether the missing name is in an ADDED section of one of them.
      If it is, the requirement is not archived yet.
   4. Tell the user:
      - The requirement name and this change's section (MODIFIED or REMOVED).
      - The active change that adds it, and its file.
      - That this change cannot be archived until that change is archived first.
   5. If no active change adds the name, tell the user the name is not in
      the main requirements and not in any active change. Ask how to proceed.
   Do not write any file in this case.
6. Write `ProjectDocs/project.md` with the full new content. Read it back.
   Confirm the changelog row exists.
7. Get today's date with `date +%Y-%m-%d`. If the slug already starts with
   `YYYY-MM-DD-`, keep it. Otherwise use `<date>-<slug>`.
8. Check that `ProjectDocs/archive/<target>` does not exist. If it exists,
   stop and ask the user.
9. Move the change folder:
   `mv ProjectDocs/changes/<slug> ProjectDocs/archive/<target>`.
10. Confirm the move. Confirm `ProjectDocs/changes/<slug>` no longer exists.
11. Show a summary: the change, the requirements added, modified, and
    removed, the ADR IDs, and the archive path. Stop.

If a step fails after step 6, do not move the change folder. Report the
state and ask the user how to proceed.

---
name: gather-references
description: Search the web for creative reference material relevant to one Creative Continuity Agent project, and stage candidates in a review file for the human to accept or reject. Use when asked to find references, inspiration, or related work for a specific project in this capstone app.
---

# Gather References

Scoped to exactly one repeatable task: given a single project in the Creative
Continuity Agent app, find outside creative reference material (existing
designs, artworks, techniques) that's stylistically or conceptually relevant
to where that project currently stands — and stage it for human review. This
skill never writes directly into the app's database; it only produces a
staging file. Adding a staged candidate as a real project entry is always a
separate, human-made decision, matching the plan's "lightweight confirmation"
principle (Plan.md, "Lightweight confirmation").

## Inputs

- `project_id` or `project_name` — which project to gather references for
  (looked up via the running app's API, `GET /api/projects/<id>`).
- Optionally, a starting focus (e.g. "ambient lighting sculpture") — if not
  given, derive one from the project's existing entry descriptions.

## Loop (repeat until stopping condition, minimum 2 full passes)

This is a loop, not a single search. Each pass is one perceive -> reason ->
act -> observe cycle:

1. **Perceive** — Read the project's current state: its name/description and
   every entry's description/phrase/date (via the app API, or from the
   staging file if this is a repeat pass). Note what's already been found
   in prior passes so searches don't repeat themselves.
2. **Reason** — Decide what's missing or under-explored. Early passes should
   focus on the project's core visual/conceptual thread; later passes should
   deliberately branch into an adjacent angle (a related technique, a
   different medium, a stylistic precedent) rather than repeating the same
   query. Write down the query and the reason for choosing it before
   searching.
3. **Act** — Run a real web search for that query. For each result worth
   keeping, append an entry to the staging file with: title, URL, a one-line
   rationale connecting it to the project (never invent a URL that wasn't
   actually returned by the search).
4. **Observe** — Re-read the staging file. Stop once there are at least 5
   distinct, non-redundant candidates covering more than one angle, or after
   4 passes, whichever comes first. Otherwise, go back to step 2 with a new
   angle.

## Output

A staging file at `reference-candidates/<project-slug>.md` containing:
- The project name/id and the date gathered
- Each pass's query and reasoning (so the loop's decisions are auditable)
- The list of candidates (title, URL, one-line rationale)
- A closing note on why the loop stopped (hit the target count, or hit the
  pass limit)

Never modify the app's SQLite database or upload files from this skill —
staging only.

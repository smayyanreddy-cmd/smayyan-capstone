# Creative Continuity Agent — Web App

A Next.js app that lets you track how a single creative project evolves over
time: upload photos of your work as you go, get an AI-written description
and a chance to note *why* each piece changed, see the most similar past
pieces resurfaced automatically, and generate a written (and slide-deck)
account of how the whole thing evolved. See [`../Plan.md`](../Plan.md) for
the full project plan and [`../BUILD_LOG.md`](../BUILD_LOG.md) for a running
log of what's been built and what broke along the way.

## What it does

- **Projects**: start a project, give it a name and one-line description.
- **Capture**: upload an image to a project with an optional short note
  (e.g. "darker palette, felt too clean before"). The app computes a CLIP
  image embedding, asks Gemini for a one-line description that combines
  the image and your note, and stores both.
- **Resurfacing**: right after upload, the 3 most visually similar past
  entries (from any project) are shown, ranked by embedding similarity.
- **Evolution timeline**: every project page shows its entries in
  chronological order with their images, descriptions, and notes.
- **Documentation**: generate an AI-written narrative of how the project
  evolved (intro, turning points, closing reflection), viewable as an
  in-page slide preview or downloaded as a polished `.pptx` — each entry's
  image gets automatically cropped around its main subject before it's
  used in a slide.

## Requirements

- Node.js 24+ (uses the built-in `node:sqlite` module — no separate
  database to install or run).
- A [Gemini API key](https://aistudio.google.com/apikey) — required for
  descriptions, documentation, and subject-aware cropping. The app still
  runs without one; those three features just silently no-op (uploads and
  the evolution timeline work regardless).

## Setup

```bash
npm install
cp .env.example .env   # then fill in GEMINI_API_KEY
npm run dev
```

Open the printed local URL (usually `http://localhost:3000`, or the next
free port if that's taken).

Data lives entirely on disk under this folder and is gitignored:
`data/app.db` (SQLite) and `public/uploads/` (originals plus
`public/uploads/cropped/` for the subject-cropped versions). Delete both to
reset to a clean slate.

## Project structure

- `app/` — pages (`/`, `/projects/[id]`, `/projects/[id]/documentation`)
  and API routes (`app/api/...`).
- `lib/` — server logic: `db.ts` (schema), `embeddings.ts` (CLIP via
  `@huggingface/transformers`), `describe.ts` / `documentation.ts` (Gemini
  text generation), `subject-crop.ts` (Gemini focal point + `sharp` crop),
  `pptx.ts` / `slides.ts` (the shared slide content model used by both the
  in-page preview and the downloaded deck).
- `components/` — shared UI (`Header`, `SlidesPreview`).

## Note on the Assessment 2 Skill/Agent exercise

The `gather-references` Skill and its `reference-gatherer` subagent (in
`../.claude/`) are **not** wired into this app's live flow — they were
built and run as a standalone exercise against this app's data, not as
part of the product itself. See the "Skill/agent decision" entry in
[`../BUILD_LOG.md`](../BUILD_LOG.md) for why: this app's actual AI needs
(describe one image, synthesize one document, find one focal point) are
single-shot content-generation calls, not the kind of open-ended,
multi-step "search and decide when to stop" task that Skill/agent loop was
built for.

## Scripts

- `npm run dev` — start the dev server (Turbopack).
- `npm run build` — production build.
- `npm run lint` — ESLint.

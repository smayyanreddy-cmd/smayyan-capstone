# Project Plan: Creative Continuity Agent

## Problem
Creative ideas — sketches, AI-render experiments, references, half-formed thoughts —
are scattered across notebooks, phone photos, chat histories, and memory. Nothing
connects them over time, so patterns and evolutions in an ongoing concept (e.g. a
recurring character or a design series) get lost instead of noticed.

## Core Idea
Not another moodboard/notebook app. The differentiator is an AI layer that:
1. Ingests creative material with near-zero friction
2. Clusters it by visual + conceptual similarity
3. Tracks how a concept evolves over time
4. Resurfaces related past work at the moment it's useful — not on a schedule

## Wedge (start narrow)
Nail ONE use case first: **tracking the evolution of any single ongoing project
that's actively being documented** (proof case: your own SR project + automotive
fusion sketches), rather than trying to be a general creative tool.

## MVP Scope (v1)
- [ ] **Ingestion**: upload a photo directly on the web interface → lands in
      one store, auto-tagged, no manual filing
- [ ] **Context capture**: optional one-line voice/text phrase attached to each
      item; AI combines phrase + image into its own short description ("why"
      behind the image, not just the image, and not just the raw phrase)
- [ ] **Clustering**: group items by visual similarity (image embeddings) +
      conceptual similarity (LLM reads captions/context)
- [ ] **Evolution view**: timeline showing how one concept/character changed across
      entries, reconstructed automatically
- [ ] **Contextual resurfacing**: when opening/adding a new related sketch, surface
      the 2–3 most relevant past pieces — triggered by activity, not a calendar ping

## User Flow
1. **Start a project** — name it (e.g. "SR", "Skyline/Silvia fusion") with a
   one-line description; this becomes the anchor everything attaches to.
2. **Capture an item** — upload a photo (sketch, screenshot, render) on the
   web interface, with an optional short phrase alongside it ("darker palette,
   felt too clean before"). The AI combines the photo + phrase and writes its
   own short description of the item — capturing what's visually there and the
   intent behind it, not just storing the raw phrase.
3. **Provisional tagging** — using that description plus similarity to past
   entries, the AI takes a first guess at which project the item belongs to.
4. **Lightweight confirmation** — right after upload (or in a quick review
   queue), it shows "Added to SR — is that right?"; one click to confirm or
   reassign, keeping tagging honest without making capture a chore.
5. **Working session** — when you open a project to add something new, the AI
   surfaces the 2–3 most relevant past entries (using their descriptions +
   images), each shown with its own generated description so you don't have to
   re-open every file to remember what it was.
6. **Evolution view** — a timeline per project showing every entry in order,
   each with its AI-written description, so the visible change in the concept
   over time is readable at a glance, not just a wall of images.
7. **Proactive pattern flag** — occasionally, when confidence is high, the AI
   points out a connection you didn't consciously make ("this shares the color
   shift you tried in March on a different project") — rare and specific, not
   frequent.

## Explicitly Out of Scope (v1)
- General-purpose notebook / mood-board features (drawing tools, templates, etc.)
- Multi-user / team collaboration
- Notifications or scheduled digests

## Architecture Sketch
Single web interface handling both capture and viewing:

- **Capture**: upload flow on the web interface — photo + optional phrase,
  no separate chat bot needed
- **Ingestion pipeline**: upload → object storage (S3) for images, plus the
  raw phrase passed to the LLM layer
- **Metadata store**: Postgres — item, timestamp, linked project,
  user phrase, AI-generated description
- **Embeddings**: image embedding model (e.g. CLIP) for visual similarity search
- **LLM layer** (Claude): combines phrase + image into a description, assigns
  conceptual tags, writes short "why this connects" explanations when resurfacing
- **Frontend**: project pages, capture/upload flow, cluster view, evolution
  timeline, and confirmation of provisional tags — all in one interface
- **Confirmation loop**: shown immediately after upload, or batched into a
  review queue on the same interface

## Validation Step (before building anything else)
Feed in existing personal material (SR pieces, Skyline/Silvia sketches, Activa
render, past captions) and check: does the clustering/evolution view surprise you
with your own work? If it doesn't reveal something you didn't already know, refine
the similarity/resurfacing logic before expanding scope.

## Open Questions
- What counts as "conceptually related" beyond visual similarity — style, subject,
  mood, or explicit character identity?
- What's the right resurfacing trigger so it feels helpful, not noisy?
- Single-user tool first, or built with multi-project structure from day one?

## Next Steps
1. Manually gather existing SR + automotive material into one folder as a test set
2. Prototype clustering only (no upload pipeline yet) to validate the concept
3. If clustering reveals something useful → build the web interface's
   upload flow first (proves the ingestion + description-generation loop)
4. Build out the rest of the web interface (cluster view, evolution timeline)
   once there's enough captured material to make it worth looking at

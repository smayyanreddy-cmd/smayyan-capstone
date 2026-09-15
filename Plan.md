# Car Modification Visualiser — Capstone Plan

## Context

Car enthusiasts often want to see how a modification (wheels, wrap color, lowering, body kit, etc.) will look on their actual car before spending money on it. This capstone builds a web app where a user uploads a photo of their car, picks mods from a structured menu, and an AI image-editing model generates a realistic "after" photo — so they can compare before/after and save builds to a personal garage. The repo (`smayyan-capstone`) started empty, so this is a greenfield build with no existing code or patterns to reuse.

## Chosen Approach

- **Visualisation mechanic**: AI image generation/editing. User uploads a photo; selected mods are turned into a structured edit instruction; an image-editing model (reference-image-in, edited-image-out) produces the "after" photo. This gives realistic results without needing a 3D asset pipeline.
- **Tech stack**: **Next.js (App Router) + TypeScript**, single full-stack app.
  - Why: one deployable app (frontend + API routes/server actions), easy to host on Vercel, minimal boilerplate compared to separate React+Express, and it's the most common stack for this kind of AI-integrated web app — good for a capstone demo and for iterating quickly.
  - Styling: Tailwind CSS.
  - Auth: NextAuth (email/password or GitHub/Google OAuth) — needed since this is a full capstone with saved builds per user.
  - Database: Postgres via Supabase (also gives free file storage for uploaded/generated images in one service) + Prisma as the ORM.
  - Image generation: an image-editing-capable model (e.g. Gemini 2.5 Flash Image or OpenAI's image edit endpoint) called from a server-side API route — never expose the API key to the client.
  - Deployment: Vercel (frontend + API routes) with Supabase as the managed DB/storage backend.

## Data Model (Prisma schema, high level)

- `User` — id, email, name, auth fields (managed by NextAuth adapter tables)
- `Car` — id, userId, make, model, year, baseImageUrl
- `Build` — id, carId, userId, mods (JSON: category → selected option), generatedImageUrl, prompt (stored for debugging/regeneration), createdAt, isPublic
- `ModOption` (seed data, not user-editable) — category (wheels, paint/wrap, ride height, body kit, exhaust tips, window tint, spoiler), label, promptFragment

## Application Structure

```
app/
  (auth)/            # sign in / sign up pages
  dashboard/          # user's garage: list of cars & saved builds
  cars/[carId]/       # car detail, upload photo, start new build
  builds/[buildId]/   # before/after view of a specific build
  gallery/            # public builds feed
  api/
    generate/route.ts # POST: photo + mod selections -> calls image model -> returns image url, persists Build
    cars/route.ts
    builds/route.ts
lib/
  prisma.ts
  auth.ts
  image-gen.ts        # builds the prompt from mod selections, calls the model, uploads result to storage
  mod-options.ts       # static catalog of mod categories/options + their prompt fragments
components/
  Uploader.tsx
  ModSelector.tsx      # category tabs (wheels, color, stance, etc.)
  BeforeAfterSlider.tsx
  GarageGrid.tsx
prisma/
  schema.prisma
```

Core flow: `Uploader` → `ModSelector` (builds a mods JSON object) → POST `/api/generate` → `lib/image-gen.ts` composes a structured prompt from `mod-options.ts` fragments + calls the image model with the original photo as reference → stores result in Supabase Storage → creates a `Build` row → returns image URL → `BeforeAfterSlider` displays result → user can save/discard.

## Milestones

1. **Scaffold**: Next.js + TypeScript + Tailwind app, Prisma schema, Supabase project wired up, NextAuth working (sign up/sign in), deployed skeleton on Vercel.
2. **Core visualize flow (single mod category)**: upload photo, pick a wheel style + paint color, call the image model, display before/after. Get prompt engineering solid for one category before expanding — this is the highest-risk/most-uncertain part (image model realism/consistency).
3. **Expand mod categories**: ride height, body kit, exhaust tips, window tint, spoiler — extend `mod-options.ts` and refine prompt composition so multiple mods combine coherently in one edit.
4. **Garage & persistence**: save builds per car/user, list/revisit past builds, delete/regenerate.
5. **Gallery & sharing**: opt-in public builds feed, view other users' builds.
6. **Polish & testing**: loading/error states for slow image generation, responsive UI, basic tests for API routes, README + deployment docs.

## Verification

- Run locally with `npm run dev`; manually walk the golden path: sign up → add a car → upload a photo → pick mods → generate → view before/after → save to garage → confirm it appears in the garage list.
- Test edge cases: no photo uploaded, image model failure/timeout (should show a retry/error state, not crash), very large uploaded images (should resize/compress before sending to the model), and unauthenticated access to `/dashboard` (should redirect to sign in).
- Check that generated images and original photos persist correctly in Supabase Storage across a page reload.
- Confirm API keys (image model, Supabase, NextAuth secrets) are only referenced server-side (`.env`, never in client bundles) — grep the client bundle or check `NEXT_PUBLIC_` prefixes are not used for secrets.

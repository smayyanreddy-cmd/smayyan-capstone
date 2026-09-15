 Build Log

A running log of progress on the Car Modification Visualiser capstone. See `Plan.md` for the full plan.

## 2026-09-11

- Initialized the git repository, pushed `feature/capstone-plan` branch to GitHub (`smayyanreddy-cmd/smayyan-capstone`).
- Wrote and approved the project plan (`Plan.md`): a Next.js + TypeScript app where users upload a photo of their car, pick mods (wheels, paint/wrap, ride height, body kit, exhaust, tint, spoiler), and an AI image-editing model generates a realistic "after" photo. Stack: Next.js (App Router), Tailwind, NextAuth, Prisma + Supabase (Postgres + storage), deployed on Vercel.
- Defined milestones: (1) scaffold + auth, (2) core visualize flow for one mod category, (3) expand mod categories, (4) garage/persistence, (5) gallery/sharing, (6) polish + testing.
- Next up: Milestone 1 — scaffold the Next.js app, set up Prisma schema, wire up Supabase, get NextAuth sign-up/sign-in working.

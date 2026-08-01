# CareShare

CareShare is a Next.js + Supabase PWA for coordinating care activities for dependents. The product supports pet and person care long-term, but current work should focus on pet care for dogs and cats.

## Product Direction

- Model the app around the dependent: one pet can have multiple caretakers.
- Optimize for fast mobile logging of care actions.
- Default activity types include food, pee, poop, nap, walk, play, train, vet, and medicine.
- Let users choose which activities appear on a dependent's home screen.
- Keep a chronological activity feed with custom timestamps and optional comments.
- Support real-time chat between caretakers for the same dependent.
- Use Supabase Auth with email magic links only; do not add passwords or third-party providers.

## Tech Stack

- Next.js App Router served by Vercel.
- Supabase for PostgreSQL, Realtime, Auth, and Row-Level Security.
- TypeScript, React, and Tailwind CSS.
- Mobile-first PWA design that feels clean and modern without being sterile.

## Engineering Rules

- Keep React and Next.js code simple, idiomatic, and easy to maintain.
- Keep TypeScript strict and follow the repo's ESLint rules.
- Avoid complex abstractions unless they clearly reduce real complexity.
- For Supabase Realtime, use unique channel names to avoid React Strict Mode races, and chain `.on()` before `.subscribe()`.
- Enforce RLS on all Supabase tables. Caretakers may only select, insert, and update data for pets they are authorized for.

## Git

- Commit messages must be a short paragraph explaining the changes.
- End each commit message with the agent and model identifier on a separate line, for example: `Co-Authored-By: Codex (GPT-5)`.

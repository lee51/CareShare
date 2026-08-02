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
- Always use `pnpm` instead of `npm` or `npx` for executing scripts and installing packages (e.g., use `pnpm supabase` instead of `npx supabase`).
- Prefer nullish coalescing (`??`) over logical OR (`||`) when checking for uninitialized values, to avoid unintentionally catching valid falsy values like empty strings or `0`.

## Git

- Explicitly ask for user permission before creating branches, committing code, pushing to the remote, or opening pull requests. Never force-push without warning the user first.
- Commit messages must be a short paragraph explaining the changes.
- End each commit message with the agent and model identifier on a separate line, for example: `Co-Authored-By: Codex (GPT-5)`.
- When updating an implementation plan (as a comment) in a GitHub Issue, make sure to edit the last comment (using `gh issue edit <issue-number> --body ...` or `gh issue comment ... --edit-last`) instead of posting a new one.

### Antigravity only

- When running the GitHub CLI (`gh`), always prepend the command with `GITHUB_TOKEN=""` (e.g., `GITHUB_TOKEN="" gh issue comment ...`) to bypass invalid global credentials.

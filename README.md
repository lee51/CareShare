# CareShare

A Next.js + Supabase Progressive Web App (PWA) for pet & person care. This branch contains the initial scaffold for the pet-care MVP (dog & cat), including database migrations, RLS policy SQL, and a mobile-first Next + Supabase frontend.

Run locally

1. Create a Supabase project and run the SQL files in the `sql/` folder (schema.sql then policies.sql).
2. Create a `.env.local` at the repo root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

3. Enable Corepack:

```
corepack enable
```

4. Install dependencies:

```
pnpm install
```

5. Start the development server:

```
pnpm dev
```

Notes

- Keep your SUPABASE_SERVICE_ROLE_KEY private; do not put it in client env vars.
- This scaffold uses the Next App Router and Tailwind for styling.

What is included

- sql/schema.sql: table definitions and default activity type seeds
- sql/policies.sql: basic RLS policies to limit access to pet caretakers
- app/: Next.js app with onboarding and pet detail pages
- components/: QuickActions, ActivityFeed, Chat
- lib/supabaseClient.ts: simple Supabase client

This is an initial scaffold intended for review. After merge we can iterate on auth UI, tests, and additional features.

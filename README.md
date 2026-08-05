# CareShare

A Next.js + Supabase Progressive Web App (PWA) for pet & person care. This branch contains the initial scaffold for the pet-care MVP (dog & cat), including database migrations, RLS policy SQL, and a mobile-first Next + Supabase frontend.

Run locally

1. Create a Supabase project and run the SQL files in the `sql/` folder (schema.sql then policies.sql).
2. Create a `.env` (or `.env.local`) at the repo root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_secret_key
```

### Developing against a **local Supabase**

```env
NEXT_PUBLIC_USE_LOCAL_DB=true
NEXT_PUBLIC_LOCAL_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_LOCAL_SUPABASE_ANON_KEY=your_local_anon_key
NEXT_PUBLIC_LOCAL_SUPABASE_SECRET_KEY=your_local_secret_key
```

3. Enable Corepack:

```bash
corepack enable
```

4. Install dependencies:

```bash
pnpm install
```

5. Start the development server:

```bash
pnpm dev
```

Notes

- Keep your `SUPABASE_SECRET_KEY` / `NEXT_PUBLIC_LOCAL_SUPABASE_SECRET_KEY` private; do not put secret keys in client env vars.
- This scaffold uses the Next App Router and Tailwind for styling.

What is included

- sql/schema.sql: table definitions and default activity type seeds
- sql/policies.sql: basic RLS policies to limit access to pet caretakers
- app/: Next.js app with onboarding and pet detail pages
- components/: QuickActions, ActivityFeed, Chat
- lib/supabaseClient.ts: simple Supabase client

This is an initial scaffold intended for review. After merge we can iterate on auth UI, tests, and additional features.

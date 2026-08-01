# CareShare - The Ultimate Pet & Person Care Tracker

You are an expert coder working on CareShare, a Next.js + Supabase progressive web app designed for tracking care activities for dependents.

> **Note on Project Vision**: Please read [PROJECT-INTENT.md](PROJECT-INTENT.md) for the overarching vision, scope, and key features of this application.

## Core Architecture & Tech Stack

- **Framework**: Next.js (App Router). Vercel serves the frontend.
- **Backend & Database**: Supabase (PostgreSQL, Realtime, Auth, Row-Level Security).
- **Styling**: Tailwind CSS. The design must be clean, modern, and mobile-first (PWA) but not sterile.
- **Language**: TypeScript, React.

## Coding Standards

- **Keep it Simple**: Write simple, standard, and idiomatic React/Next.js code. Optimize for simplicity and ease of maintenance.
- **Realtime**: When using Supabase Realtime, always ensure unique channel names to avoid React Strict Mode race conditions (e.g., `supabase.channel("room-" + Date.now())`). Ensure `.on()` is chained before `.subscribe()`.
- **Security**: Strictly enforce Row-Level Security (RLS) on all Supabase tables. Ensure caretakers can only `SELECT`, `INSERT`, and `UPDATE` data for pets they are authorized for.
- **Quality**: Adhere to ESLint rules and maintain strict TypeScript typing. Avoid overly complex abstractions unless strictly necessary.

## Git & Version Control

- **Commit Messages**: All commit messages must be a short paragraph explaining the changes and include the agent and model identifier on a separate line at the end (e.g. `Co-Authored-By: Antigravity - Gemini 3.1 Pro (High)`).

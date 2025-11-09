# Quizzify Nexus

A modern quiz platform built with React 18, Vite, TypeScript, TailwindCSS, shadcn/ui, TanStack Query, and Supabase.

## Features
- Supabase Auth (email/password) with user and admin flows
- Role check via `admin_accounts` table for admin routes
- CRUD for quizzes, questions, MCQ options
- Quiz attempts and answers, auto-scoring for MCQ
- User History and Profile (Supabase-backed)
- Admin panels: Quizzes, Users, Performance, Dashboard analytics
- Route guards for authenticated and admin-only pages

## Tech Stack
- React 18 + Vite + TypeScript
- TailwindCSS + shadcn/ui components
- TanStack Query v5 for data fetching
- Supabase (Auth + Postgres + RLS)

## Getting Started

### 1) Clone and install
```bash
pnpm install
# or npm install / yarn install
```

### 2) Environment variables
Create a `.env` file in the project root:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_public_key
```

### 3) Supabase setup
Provision a Supabase project and apply the schema (tables suggested):
- profiles
- admin_accounts
- quizzes
- questions
- mcq_options
- attempts
- attempt_answers
- (optional) quiz_performance view for analytics

Enable Email/Password provider in Auth and set Site URL/CORS for your dev origin (e.g. http://localhost:5173).

### 4) Run dev server
```bash
pnpm dev
# or npm run dev / yarn dev
```

## Project Structure (highlights)
- `src/integrations/supabase.ts` – Supabase client
- `src/lib/auth.tsx` – AuthProvider, `useAuth`, `RequireAuth`, `RequireAdmin`
- `src/App.tsx` – Routes
- `src/pages` – App pages (user + admin)
- `src/components` – UI and layout components

## Key Pages
- User: Login, Signup, Dashboard, Quizzes, QuizAttempt, History, Profile
- Admin: Login, Dashboard, Quizzes (list/create/edit/detail), Users, Performance

## Styling
- Buttons/inputs are pill-shaped (rounded-full)
- Cards and containers use a comfortable large radius
- Toasts appear top-right; success = green, destructive = red

## Notes
- Ensure RLS policies align with the intended access:
  - Users can read/update their `profiles` row and their own `attempts`
  - Admins can manage `quizzes`, `questions`, `mcq_options`, and list/delete `profiles`

## Scripts
- `dev` – start development server
- `build` – production build
- `preview` – preview production build

## License
MIT
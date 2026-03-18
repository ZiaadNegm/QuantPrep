@AGENTS.md

# QuantPrep — Mental Math Training App

## Overview

QuantPrep is a mental math training web app for quant finance interview prep. Users practice arithmetic under time pressure across 5 difficulty levels with practice and test modes.

**Stack:** Next.js 16 (App Router) + Supabase (Auth + Postgres) + Tailwind CSS + Vercel

## Architecture

### Route Groups

- `(auth)` — Login/signup pages (unauthenticated)
- `(app)` — All authenticated pages (dashboard, mental-math, statistics, mistakes, profile)

### Key Pages

| Page | Path | Purpose |
|---|---|---|
| Dashboard | `/dashboard` | Streak, recent stats, module navigation |
| Practice Config | `/mental-math/practice` | Configure levels, operations, number types, question count |
| Test Select | `/mental-math/test` | Pick from hardcoded test presets (e.g. "80 in 8") |
| Session | `/mental-math/session/[sessionId]` | Active quiz — client-side answer tracking, auto-submit, timer |
| Results | `/mental-math/results/[sessionId]` | Score, accuracy, response times, mistakes review |
| Statistics | `/statistics` | Accuracy/response time charts over time (recharts) |
| Mistakes | `/mistakes` | Filterable list of past wrong/skipped answers |
| Profile | `/profile` | Display name + timezone settings |

### API Routes

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/sessions` | POST | Create session + generate questions |
| `/api/sessions/[id]` | GET | Fetch session + questions (strips correct_answer from unanswered, includes answer_length for auto-submit) |
| `/api/sessions/[id]` | PATCH | Pause/resume session |
| `/api/sessions/[id]/complete` | POST | Batch submit answers, compute aggregates, update streak |
| `/api/sessions/[id]/answer` | POST | Per-question answer (legacy, unused — batch submit preferred) |
| `/api/sessions/[id]/skip` | POST | Per-question skip (legacy, unused) |
| `/api/stats` | GET | Aggregated stats for charts |
| `/api/stats/breakdown` | GET | Per-level/operation breakdown |
| `/api/mistakes` | GET | Paginated mistakes list |
| `/api/presets` | GET | Test preset definitions |

### Session Architecture (Client-Side)

The session page (`session/[sessionId]/page.tsx`) uses `useReducer` for state management. **No per-question API calls** — all answers are tracked client-side for instant response:

1. On mount: fetch session + questions from GET endpoint
2. Each answer/skip: dispatch to reducer (instant), autosave to localStorage
3. On completion (all answered, timer expired, or "End Session" clicked): single POST to `/complete` with all answers
4. Server validates answers with `checkAnswer()` — correct answers never sent to client during session
5. localStorage backup enables crash recovery (resume from where you left off)

**Auto-submit:** The server sends `answer_length` (character count of correct answer) with each unanswered question. When the user's input length matches, the answer auto-submits after 150ms. Manual Enter/Submit still works as fallback.

### Question Generator (`src/lib/generator/`)

Procedural question generation with seeded PRNG for reproducibility:

- `index.ts` — Main `generateSession(config, seed)` entry point
- `rng.ts` — Seeded PRNG (mulberry32 + cyrb53 hash)
- `balancer.ts` — Even distribution across levels/operations/number types
- `normalization.ts` — Answer normalization + `checkAnswer()` (integers, decimals, fractions, negatives)
- `validation.ts` — Dedup and edge case filtering
- `levels/l1.ts` through `l5.ts` — Level-specific generators

**Levels:**
- L1: Single-digit arithmetic
- L2: Two-digit +/- one-digit, simple multiplication
- L3: Two-digit arithmetic, larger multiplication
- L4: Three-digit operations, decimal arithmetic
- L5: Large number operations, complex fractions

### Database (Supabase Postgres)

Schema defined in `supabase/schema.sql`. Tables:

| Table | Purpose |
|---|---|
| `profiles` | User display name + timezone (auto-created on signup) |
| `sessions` | Session metadata, scores, aggregates |
| `question_instances` | Individual questions per session with answers |
| `streaks` | Daily streak tracking (qualifying threshold: 5 questions) |
| `test_presets` | Predefined test configurations |

All tables have Row Level Security (RLS) — users can only access their own data. Primary keys use `bigint identity`.

### Supabase Auth

- Server client: `src/lib/supabase/server.ts` (cookie-based via `@supabase/ssr`)
- Browser client: `src/lib/supabase/client.ts`
- Middleware: `src/middleware.ts` — protects `(app)` routes, redirects unauthenticated users

## Commands

```bash
npm run dev        # Dev server (port 3020)
npm run build      # Production build
npm run lint       # ESLint
npx tsc --noEmit   # Type check
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase anon/publishable key>
```

## Code Conventions

- **DB columns:** snake_case (`correct_answer`, `response_time_ms`)
- **Frontend:** camelCase (`correctAnswer`, `responseTimeMs`)
- **API responses:** Return raw snake_case from Supabase; frontend maps on receive
- **Scoring:** Practice = +1 per correct. Test = +1 correct, -1 wrong, 0 skipped.

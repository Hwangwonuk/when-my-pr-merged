# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server
npm run build        # Production build (requires DATABASE_URL)
npm run lint         # ESLint
npm run test         # vitest run (all tests)
npm run test:watch   # vitest watch mode
npx vitest run src/__tests__/format.test.ts  # Run single test file
npm run db:seed      # Seed badge data (npx tsx prisma/seed.ts)
npx prisma migrate dev   # Run DB migrations
npx prisma generate      # Regenerate Prisma client
npx tsc --noEmit         # Type check (works without DATABASE_URL)
```

## Architecture

GitHub PR 리뷰/머지 분석 대시보드. GitHub App 웹훅으로 PR 이벤트를 수집하고, 통계/인사이트를 대시보드와 Slack으로 제공한다.

### Data Flow

```
GitHub Webhook → /api/webhooks/github → handlers/ → PostgreSQL (Prisma)
                                            ↓
                                    Slack notifications
                                    (stale PR, hot streak, fast review praise)

Vercel Cron → /api/cron/* → stats engine → Slack weekly report, badge awards

Dashboard pages (Server Components) → prisma direct queries → rendered HTML
```

### Key Directories

- `src/lib/github/handlers/` — Webhook event handlers (installation, pull-request, pull-request-review). These compute precomputed metrics on PullRequest (timeToFirstReviewMs, timeToMergeMs, revisionCount).
- `src/lib/stats/` — Statistics engine. Pure computation over Prisma queries: overview stats, reviewer rankings, hourly/daily patterns, bottleneck analysis, hot streak detection.
- `src/lib/slack/` — Slack WebClient factory, Korean message templates (Block Kit), notification senders.
- `src/app/(dashboard)/[orgSlug]/` — Org-scoped dashboard pages. All are **async Server Components** that query Prisma directly (no API round-trip).
- `src/app/api/cron/` — Vercel Cron endpoints (stale-prs hourly, daily-digest, weekly-report Monday, badge-awards Monday). All require `CRON_SECRET` Bearer token.

### Precomputed Metrics Pattern

PullRequest stores precomputed timing fields (`timeToFirstReviewMs`, `timeToMergeMs`, `revisionCount`, `reviewCycleCount`) updated by webhook handlers at write time, avoiding expensive joins at query time.

ReviewRequest is a separate model from Review — it tracks when a review was requested vs fulfilled, enabling accurate reviewer response time calculation.

### Auth Flow

GitHub OAuth → iron-session cookie (`wpmm-session`). `getCurrentUser()` from `src/lib/auth/session.ts` returns session data. Dashboard layout redirects to `/login` if no session.

## Prisma v7 Specifics

- **No `url` in schema.prisma** — database URL is in `prisma.config.ts`
- Generator uses `provider = "prisma-client"` (not `prisma-client-js`)
- Output path: `../src/generated/prisma`, import from `../../src/generated/prisma/client`
- PrismaClient constructor requires type casting:
  ```ts
  new (PrismaClient as unknown as new () => InstanceType<typeof PrismaClient>)()
  ```
- `next build` fails without DATABASE_URL at runtime, but `tsc --noEmit` passes

## Conventions

- **Language**: All UI strings are in Korean. Format utils output Korean units (초/분/시간/일).
- **Files**: kebab-case (`pull-request.ts`, `stats-card.tsx`)
- **Imports**: Use `@/*` path alias (`@/lib/prisma`, `@/types`)
- **Components**: Server Components by default. Mark `"use client"` only when needed (interactivity, hooks).
- **CSS**: Tailwind utility classes with `cn()` helper (clsx + tailwind-merge) from `@/lib/utils/cn`
- **API routes**: Zod validation on query params, consistent `{ error, status }` responses, session auth check first
- **Charts**: Recharts v3. Tooltip formatter must not have explicit parameter type annotations (use `(value) =>` not `(value: number) =>`).
- **Tests**: Vitest with `describe/it/expect`. Test files in `src/__tests__/`. Currently tests pure functions only (format utils, Slack message templates).

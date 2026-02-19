# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server
npm run build        # Production build (requires DATABASE_URL)
npm run lint         # ESLint
npm run test         # vitest run (all unit tests)
npm run test:watch   # vitest watch mode
npm run test:e2e     # Playwright E2E tests
npx vitest run src/__tests__/format.test.ts  # Run single test file
npm run db:seed      # Seed badge data (npx tsx prisma/seed.ts)
npm run setup:check  # Validate all env vars are set (npx tsx scripts/setup-check.ts)
npx prisma migrate dev   # Run DB migrations
npx prisma generate      # Regenerate Prisma client
npx tsc --noEmit         # Type check (works without DATABASE_URL)
```

## Architecture

GitHub PR 리뷰/머지 분석 대시보드. GitHub App 웹훅으로 PR 이벤트를 수집하고, 통계/인사이트를 대시보드와 Slack으로 제공한다.

**Live**: https://when-my-pr-merged.vercel.app

### Data Flow

```
GitHub Webhook → /api/webhooks/github → handlers/ → PostgreSQL (Prisma)
                                            ↓
                                    Slack notifications
                                    (stale PR, hot streak, fast review praise)

Vercel Cron → /api/cron/* → stats engine → Slack digest, weekly report, badge awards

Dashboard pages (async Server Components) → Prisma direct queries → rendered HTML
```

### Key Directories

- `src/lib/github/handlers/` — Webhook event handlers (installation, pull-request, pull-request-review). Compute precomputed metrics on PullRequest at write time.
- `src/lib/stats/` — Statistics engine: calculator, patterns, reviewer-ranking, predictions, reviewer-recommendation, conflict-patterns, hot-streak. Pure computation over Prisma queries.
- `src/lib/slack/` — `app.ts` (WebClient factory), `messages.ts` (Korean Block Kit templates), `notifications.ts` (notification senders).
- `src/lib/auth/session.ts` — iron-session 기반 세션 관리. `getCurrentUser()` 로 세션 조회.
- `src/lib/utils/` — `cn.ts` (clsx + tailwind-merge), `format.ts` (한국어 포맷), `constants.ts`.
- `src/app/(dashboard)/[orgSlug]/` — Org-scoped dashboard pages (stats, reviewers, insights, leaderboard, reports, settings). All async Server Components querying Prisma directly.
- `src/app/api/cron/` — Vercel Cron endpoints. All require `CRON_SECRET` Bearer token auth.
- `src/types/` — Shared TypeScript interfaces (OverviewStats, ReviewerRanking, HourlyPattern, MergePrediction, etc.)

### API Routes

| Route | Method | Auth | Purpose |
|-------|--------|------|---------|
| `/api/auth/github` | GET | - | GitHub OAuth 시작 |
| `/api/auth/github/callback` | GET | - | OAuth 콜백 |
| `/api/auth/session` | GET | Session | 세션 정보 |
| `/api/webhooks/github` | POST | HMAC-SHA256 | GitHub 웹훅 수신 |
| `/api/webhooks/slack` | POST | Signing Secret | Slack 이벤트 |
| `/api/stats/overview` | GET | Session | 개요 통계 |
| `/api/stats/reviewers` | GET | Session | 리뷰어 랭킹 |
| `/api/stats/patterns` | GET | Session | 시간대/요일 패턴 |
| `/api/stats/size-analysis` | GET | Session | PR 크기별 분석 |
| `/api/stats/bottleneck` | GET | Session | 병목 분석 |
| `/api/stats/conflicts` | GET | Session | 컨플릭트 패턴 |
| `/api/stats/predictions/[prId]` | GET | Session | 머지 시간 예측 |
| `/api/stats/recommendations` | GET | Session | 리뷰어 추천 |
| `/api/slack/install` | GET | - | Slack OAuth 시작 |
| `/api/slack/install/callback` | GET | - | Slack OAuth 콜백 |
| `/api/slack/channels` | GET/POST | Session | 채널 조회/설정 |
| `/api/slack/commands` | POST | Signing Secret | 슬래시 커맨드 |
| `/api/installations` | GET | Session | 설치 정보 |
| `/api/og/stats-card` | GET | - | OG 이미지 생성 |

### Cron Schedules (vercel.json)

| Endpoint | Schedule | Description |
|----------|----------|-------------|
| `/api/cron/stale-prs` | `0 9 * * *` | 매일 9AM UTC — 방치 PR 알림 |
| `/api/cron/daily-digest` | `0 1 * * *` | 매일 1AM UTC — 일간 다이제스트 |
| `/api/cron/weekly-report` | `0 1 * * 1` | 매주 월요일 1AM UTC — 주간 리포트 |
| `/api/cron/badge-awards` | `0 2 * * 1` | 매주 월요일 2AM UTC — 배지 수여 |

### Precomputed Metrics Pattern

PullRequest stores precomputed timing fields (`timeToFirstReviewMs`, `timeToMergeMs`, `revisionCount`, `reviewCycleCount`) updated by webhook handlers at write time, avoiding expensive joins at query time.

ReviewRequest is a separate model from Review — it tracks when a review was requested vs fulfilled, enabling accurate reviewer response time calculation.

### Auth Flow

GitHub OAuth → iron-session cookie (`wpmm-session`). Middleware (`src/middleware.ts`) checks cookie presence and redirects unauthenticated users to `/login`. Protected pages: `/`, `/profile`, `/[orgSlug]/*`. Protected APIs: `/api/stats/*`, `/api/installations`. Excluded from auth: `/api/auth`, `/api/webhooks`, `/api/cron`, `/api/og`, `/api/slack`, `/share`.

## Environment Variables

All required env vars are documented in `.env.example`. Run `npm run setup:check` to validate.

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL 연결 (Neon) |
| `GITHUB_APP_ID` | GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | GitHub App 개인키 (`\\n` → 실제 줄바꿈 변환 필요) |
| `GITHUB_WEBHOOK_SECRET` | 웹훅 HMAC-SHA256 서명 검증 |
| `GITHUB_CLIENT_ID` | OAuth Client ID (`Iv23...` 형식) |
| `GITHUB_CLIENT_SECRET` | OAuth Client Secret |
| `GITHUB_APP_SLUG` | GitHub App 설치 URL에 사용 |
| `SLACK_CLIENT_ID` | Slack App Client ID |
| `SLACK_CLIENT_SECRET` | Slack App Client Secret |
| `SLACK_SIGNING_SECRET` | Slack 요청 서명 검증 |
| `SESSION_SECRET` | iron-session 암호화 키 (32자+) |
| `CRON_SECRET` | Vercel Cron 인증 토큰 |
| `NEXT_PUBLIC_APP_URL` | 앱 기본 URL (OAuth redirect 등에 사용) |

## Prisma v7 Specifics

- **No `url` in schema.prisma** — database URL is in `prisma.config.ts`
- Runtime adapter: `@prisma/adapter-pg` with `PrismaPg` in `src/lib/prisma.ts`
- Generator uses `provider = "prisma-client"` (not `prisma-client-js`)
- Output path: `../src/generated/prisma`, import from `../../src/generated/prisma/client`
- PrismaClient constructor requires type casting:
  ```ts
  new (PrismaClient as unknown as new () => InstanceType<typeof PrismaClient>)()
  ```
- `next build` fails without DATABASE_URL at runtime, but `tsc --noEmit` passes

## Testing

- **Unit tests**: Vitest, files in `src/__tests__/` (format, constants, conflict-patterns, pr-size-guide, slack-messages)
- **E2E tests**: Playwright, files in `e2e/` (api-health, auth, public-pages)
- Run single unit test: `npx vitest run src/__tests__/format.test.ts`
- Run E2E: `npm run test:e2e` (requires app running or `PLAYWRIGHT_TEST_BASE_URL`)

## Conventions

- **Language**: All UI strings are in Korean. Format utils output Korean units (초/분/시간/일).
- **Files**: kebab-case (`pull-request.ts`, `stats-card.tsx`)
- **Imports**: Use `@/*` path alias (`@/lib/prisma`, `@/types`)
- **Components**: Server Components by default. Mark `"use client"` only when needed (interactivity, hooks).
- **CSS**: Tailwind CSS v4 utility classes with `cn()` helper (clsx + tailwind-merge) from `@/lib/utils/cn`
- **API routes**: Zod validation on query params, consistent `{ error, status }` responses, session auth check first
- **Charts**: Recharts v3. Tooltip formatter must not have explicit parameter type annotations (use `(value) =>` not `(value: number) =>`).
- **Env vars**: Vercel에서 `echo` 대신 `printf`로 설정 (trailing newline `%0A` 방지)

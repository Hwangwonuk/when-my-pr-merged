# 내 PR 언제 머지돼?

GitHub PR 리뷰/머지 프로세스를 분석하고 팀의 코드 리뷰 문화를 개선하는 대시보드입니다.
GitHub App으로 PR 이벤트를 실시간 수집하고, 통계와 인사이트를 대시보드 및 Slack으로 제공합니다.

## 주요 기능

### 대시보드

| 페이지 | 설명 |
|--------|------|
| **개요** | 30일간 PR 통계 요약 (총 PR, 평균 머지 시간, 첫 리뷰 시간, 머지율) + 오픈 PR 머지 예측 |
| **통계** | 시간대별 히트맵, 요일별 머지 시간, PR 크기별 분석 |
| **리뷰어 랭킹** | 응답 속도 기반 리뷰어 순위 + 속도 비교 차트 |
| **인사이트** | 병목 분석, 재작업 통계, 컨플릭트 패턴 (요일/크기별) |
| **리더보드** | 리뷰어/PR 머지 순위 + 최근 수상 배지 |
| **리포트** | 최근 3개월 월간 통계 + 전월 대비 비교 |
| **설정** | Slack 연동, 저장소 목록, 알림 설정 |
| **프로필** | 개인 PR/리뷰 통계 + 획득 배지 |

### Slack 연동

- **방치 PR 알림** — 24시간 이상 리뷰 없는 PR 자동 알림 (매시간)
- **빠른 리뷰 칭찬** — 30분 이내 리뷰 완료 시 자동 칭찬
- **Hot Streak** — 연속 PR이 1시간 내 머지될 때 알림
- **머지 예측** — PR 오픈 시 예상 머지 시간 알림
- **일간 다이제스트 / 주간 리포트** — 정기 팀 통계
- **슬래시 커맨드** — `/pr-stats`, `/pr-leaderboard`, `/pr-stale`

### 배지 시스템

| 배지 | 등급 | 기준 |
|------|------|------|
| 리뷰왕 | Gold | 기간 내 리뷰 최다 (10건+) |
| 번개 리뷰어 | Gold | 평균 리뷰 응답 30분 이내 |
| 스트릭 마스터 | Silver | 연속 3개 PR 1시간 내 머지 |
| 도움왕 | Silver | Changes Requested 리뷰 최다 (5건+) |
| 꾸준한 리뷰어 | Silver | 5일 연속 매일 리뷰 |
| 최속 승인자 | Bronze | 가장 빠른 평균 승인 시간 |
| 작은 PR 챔피언 | Bronze | PR의 80%+가 100줄 이하 |

### 기타

- **PR 크기 가이드** — PR 오픈 시 크기별 자동 GitHub 코멘트
- **공유 카드** — 개인 통계 OG 이미지 생성 + 공유 페이지 (`/share/user-{login}`)
- **머지 예측 모델** — 작성자 히스토리, PR 크기, 요일/시간, 리뷰어 작업량 기반 예측
- **리뷰어 추천** — 경험(40%) + 응답 속도(30%) + 현재 작업량(30%) 기반

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) + TypeScript |
| DB | PostgreSQL + Prisma v7 |
| GitHub | GitHub App (Webhook + Installation Token) |
| Slack | @slack/web-api |
| 인증 | GitHub OAuth + iron-session |
| UI | Tailwind CSS v4 + Recharts v3 |
| 배포 | Vercel |
| 테스트 | Vitest (유닛) + Playwright (E2E) |

---

## 아키텍처

```
GitHub (PR 이벤트) ──webhook──> /api/webhooks/github
                                    │
                                    ▼
                              이벤트 핸들러 ──> PostgreSQL (Prisma)
                                    │                │
                                    ▼                ▼
                              Slack 알림       통계 엔진
                              (방치 PR,            │
                               칭찬, 예측)         ▼
                                           대시보드 (Server Components)
                                           차트, 랭킹, 인사이트

Vercel Cron ──정기 실행──> /api/cron/*
                          (방치 PR, 다이제스트, 주간 리포트, 배지)
```

### 핵심 설계

- **사전 계산 메트릭** — PR에 `timeToFirstReviewMs`, `timeToMergeMs` 등을 웹훅 수신 시 미리 계산하여 저장. 대시보드 조회 시 비용이 큰 JOIN을 회피
- **Server Components** — 대시보드 페이지는 모두 async Server Component로 Prisma 직접 쿼리. API 라운드트립 없음
- **ReviewRequest 분리** — Review와 별도로 리뷰 요청/응답 시점을 추적하여 정확한 응답 시간 계산

---

## 프로젝트 구조

```
src/
├── app/
│   ├── (auth)/login/              # GitHub OAuth 로그인
│   ├── (dashboard)/
│   │   ├── [orgSlug]/             # 조직별 대시보드
│   │   │   ├── stats/             # 통계
│   │   │   ├── reviewers/         # 리뷰어 랭킹
│   │   │   ├── insights/          # 인사이트 + 컨플릭트 분석
│   │   │   ├── leaderboard/       # 리더보드
│   │   │   ├── reports/           # 월간 리포트
│   │   │   └── settings/          # 설정
│   │   └── profile/               # 개인 프로필
│   ├── api/
│   │   ├── webhooks/github/       # GitHub 웹훅 수신
│   │   ├── auth/                  # OAuth 흐름
│   │   ├── cron/                  # 정기 작업
│   │   ├── stats/                 # 통계 API
│   │   ├── slack/commands/        # Slack 슬래시 커맨드
│   │   └── og/stats-card/         # 공유 이미지 생성
│   └── share/[cardId]/            # 공유 페이지
├── lib/
│   ├── github/handlers/           # 웹훅 이벤트 핸들러
│   ├── stats/                     # 통계 엔진 (계산, 예측, 추천, 패턴)
│   ├── slack/                     # Slack 메시지 템플릿 + 알림
│   └── auth/                      # 세션 관리
├── components/
│   ├── dashboard/                 # 대시보드 위젯
│   ├── charts/                    # 차트 컴포넌트
│   └── shared/                    # 공통 컴포넌트
└── __tests__/                     # 유닛 테스트

e2e/                               # E2E 테스트 (Playwright)
prisma/
├── schema.prisma                  # DB 스키마
└── seed.ts                        # 배지 시드 데이터
```

---

## 로컬 개발

```bash
npm install
npm run dev
```

> 실제 데이터 연동이 필요한 경우 `.env.example`을 참고하여 환경변수를 설정하세요.
> 프로덕션 배포 가이드는 [DEPLOY.md](./DEPLOY.md)를 참고해주세요.

## 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run test` | 유닛 테스트 (Vitest) |
| `npm run test:e2e` | E2E 테스트 (Playwright) |
| `npm run lint` | ESLint |
| `npm run db:seed` | 배지 시드 데이터 |
| `npm run setup:check` | 배포 전 환경변수 검증 |

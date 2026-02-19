# 배포 가이드

## 1. 사전 준비

### 1-1. PostgreSQL 프로비저닝

**Neon (권장)** 또는 Vercel Postgres 중 선택:

```bash
# Neon: https://neon.tech 에서 프로젝트 생성 후 CONNECTION_STRING 복사
# Vercel Postgres: Vercel 대시보드 > Storage > Create Database

# 연결 문자열 형식:
# postgresql://user:password@host:5432/dbname?sslmode=require
```

### 1-2. GitHub App 등록

1. https://github.com/settings/apps > **New GitHub App**
2. 설정값:

| 항목 | 값 |
|------|-----|
| App name | `내 PR 언제 머지돼` (고유한 이름) |
| Homepage URL | `https://your-domain.vercel.app` |
| Callback URL | `https://your-domain.vercel.app/api/auth/github/callback` |
| Webhook URL | `https://your-domain.vercel.app/api/webhooks/github` |
| Webhook secret | 랜덤 문자열 생성 (`openssl rand -hex 32`) |

3. 권한 (Permissions):
   - **Repository**: Pull requests (Read & Write), Contents (Read), Metadata (Read)
   - **Organization**: Members (Read)

4. 이벤트 구독 (Subscribe to events):
   - Pull request
   - Pull request review
   - Installation

5. 생성 후:
   - **App ID** → `GITHUB_APP_ID`
   - **Client ID** → `GITHUB_CLIENT_ID`
   - **Client Secret** 생성 → `GITHUB_CLIENT_SECRET`
   - **Private Key** 생성 (PEM 다운로드) → `GITHUB_APP_PRIVATE_KEY`

### 1-3. Slack App 등록 (선택)

1. https://api.slack.com/apps > **Create New App** > From scratch
2. 기본 정보:

| 항목 | 값 |
|------|-----|
| App Name | `내 PR 언제 머지돼` |
| Signing Secret | → `SLACK_SIGNING_SECRET` |

3. **OAuth & Permissions** > Bot Token Scopes:
   - `chat:write`
   - `commands`
   - `channels:read`

4. **Slash Commands** 등록:
   - `/pr-stats` → `https://your-domain.vercel.app/api/slack/commands`
   - `/pr-leaderboard` → `https://your-domain.vercel.app/api/slack/commands`
   - `/pr-stale` → `https://your-domain.vercel.app/api/slack/commands`

5. **OAuth & Permissions**:
   - Client ID → `SLACK_CLIENT_ID`
   - Client Secret → `SLACK_CLIENT_SECRET`

## 2. Vercel 배포

### 2-1. 프로젝트 연결

```bash
# Vercel CLI 설치 (없다면)
npm i -g vercel

# 프로젝트 연결
vercel link
```

### 2-2. 환경변수 설정

```bash
# 필수
vercel env add DATABASE_URL
vercel env add GITHUB_APP_ID
vercel env add GITHUB_APP_PRIVATE_KEY    # PEM 내용 전체 (개행 포함)
vercel env add GITHUB_WEBHOOK_SECRET
vercel env add GITHUB_CLIENT_ID
vercel env add GITHUB_CLIENT_SECRET
vercel env add SESSION_SECRET            # openssl rand -hex 32
vercel env add NEXT_PUBLIC_APP_URL       # https://your-domain.vercel.app

# 선택 (Slack 연동)
vercel env add SLACK_CLIENT_ID
vercel env add SLACK_CLIENT_SECRET
vercel env add SLACK_SIGNING_SECRET

# 크론 보안
vercel env add CRON_SECRET              # openssl rand -hex 32
```

> **GITHUB_APP_PRIVATE_KEY 주의사항**: Vercel 환경변수에서 개행(`\n`)이 포함된 PEM을 입력할 때, Vercel 대시보드 UI를 사용하세요. CLI로 입력하면 개행이 손실될 수 있습니다.

### 2-3. 데이터베이스 마이그레이션

```bash
# 로컬에서 마이그레이션 실행 (DATABASE_URL이 프로덕션 DB를 가리키도록)
DATABASE_URL="your-production-url" npx prisma migrate deploy

# 배지 시드 데이터 삽입
DATABASE_URL="your-production-url" npm run db:seed
```

### 2-4. 배포

```bash
# 프로덕션 배포
vercel --prod
```

### 2-5. 도메인 연결 (선택)

```bash
vercel domains add your-domain.com
```

배포 후 GitHub App과 Slack App의 URL을 실제 도메인으로 업데이트하세요.

## 3. 배포 후 검증

### 3-1. 환경 변수 검증 스크립트

```bash
npx tsx scripts/setup-check.ts
```

### 3-2. 체크리스트

- [ ] `https://your-domain/login` 접속 → GitHub 로그인 성공
- [ ] GitHub App 설치 → 조직/저장소 선택 → 대시보드 접속
- [ ] PR 생성 시 웹훅 수신 확인 (Vercel 로그)
- [ ] PR 생성 시 크기 가이드 코멘트 자동 게시
- [ ] Slack 연동 시 `/pr-stats` 명령어 응답
- [ ] Vercel 대시보드 > Cron Jobs에서 스케줄 확인
- [ ] `https://your-domain/share/user-{login}` 공유 페이지 접속

## 4. 크론 작업 스케줄

| 크론 | 주기 | 설명 |
|------|------|------|
| `/api/cron/stale-prs` | 매시간 | 방치 PR 슬랙 알림 |
| `/api/cron/daily-digest` | 매일 01:00 UTC | 일간 다이제스트 |
| `/api/cron/weekly-report` | 매주 월 01:00 UTC | 주간 리포트 |
| `/api/cron/badge-awards` | 매주 월 02:00 UTC | 배지 평가 |

## 5. 트러블슈팅

### 웹훅이 수신되지 않을 때
- GitHub App > Advanced > Recent Deliveries에서 응답 코드 확인
- Vercel Function Logs에서 에러 확인
- `GITHUB_WEBHOOK_SECRET`이 일치하는지 확인

### Prisma 에러
- `npx prisma migrate deploy` 재실행
- `npx prisma generate`로 클라이언트 재생성

### 로그인 실패
- `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` 확인
- Callback URL이 정확히 일치하는지 확인
- `SESSION_SECRET`이 32자 이상인지 확인

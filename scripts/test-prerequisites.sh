#!/usr/bin/env bash
# test-prerequisites.sh — 전제 조건 확인 스크립트
# E2E PR 테스트를 실행하기 전에 모든 필수 조건이 충족되었는지 확인한다.

set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)); }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; ((WARN++)); }
info() { echo -e "  ${BLUE}ℹ${NC} $1"; }

APP_URL="${NEXT_PUBLIC_APP_URL:-https://when-my-pr-merged.vercel.app}"
REPO="${TEST_REPO:-Hwangwonuk/when-my-pr-merged}"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  E2E PR 테스트 전제 조건 확인"
echo "══════════════════════════════════════════════════════════"
echo ""

# ─────────────────────────────────────────────
echo "1. GitHub CLI 인증"
echo "─────────────────────────────────────────────"
if gh auth status &>/dev/null; then
  GH_USER=$(gh api /user --jq '.login' 2>/dev/null || echo "unknown")
  pass "gh CLI 인증됨 (user: $GH_USER)"
else
  fail "gh CLI 인증 안됨 — 'gh auth login' 실행 필요"
fi

# ─────────────────────────────────────────────
echo ""
echo "2. 테스트 리포지토리 접근"
echo "─────────────────────────────────────────────"
if gh api "/repos/$REPO" --jq '.full_name' &>/dev/null; then
  DEFAULT_BRANCH=$(gh api "/repos/$REPO" --jq '.default_branch' 2>/dev/null)
  pass "리포 접근 가능: $REPO (기본 브랜치: $DEFAULT_BRANCH)"
else
  fail "리포 접근 불가: $REPO"
fi

# ─────────────────────────────────────────────
echo ""
echo "3. GitHub App 설치 확인"
echo "─────────────────────────────────────────────"
# GitHub App 웹훅은 App 레벨에서 동작하므로 직접 확인이 어렵다.
# 대신 앱이 접근 가능한 설치가 있는지 확인한다.
INSTALLATIONS=$(gh api "/user/installations" --jq '.total_count' 2>&1)
INSTALL_EXIT=$?
if [[ $INSTALL_EXIT -ne 0 || "$INSTALLATIONS" == *"message"* || "$INSTALLATIONS" == *"error"* ]]; then
  warn "GitHub App 설치 확인 불가 (토큰 권한 부족 — 정상)"
  info "수동 확인: GitHub App 설정 → Installations에서 테스트 리포가 포함된 설치 확인"
  info "미설치 시: https://github.com/apps/{APP_SLUG}/installations/new"
elif [[ "$INSTALLATIONS" =~ ^[0-9]+$ && "$INSTALLATIONS" -gt 0 ]]; then
  pass "GitHub App 설치 발견: ${INSTALLATIONS}개"
else
  warn "GitHub App 설치 확인 불가 — GitHub App 설정에서 직접 확인 필요"
fi

# ─────────────────────────────────────────────
echo ""
echo "4. 배포된 앱 접근"
echo "─────────────────────────────────────────────"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" 2>/dev/null || echo "000")
if [[ "$HTTP_STATUS" == "200" || "$HTTP_STATUS" == "302" || "$HTTP_STATUS" == "307" ]]; then
  pass "앱 접근 가능: $APP_URL (HTTP $HTTP_STATUS)"
else
  fail "앱 접근 불가: $APP_URL (HTTP $HTTP_STATUS)"
fi

# ─────────────────────────────────────────────
echo ""
echo "5. 웹훅 엔드포인트"
echo "─────────────────────────────────────────────"
WEBHOOK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$APP_URL/api/webhooks/github" 2>/dev/null || echo "000")
if [[ "$WEBHOOK_STATUS" == "401" ]]; then
  pass "웹훅 엔드포인트 응답 (HTTP 401 — 서명 없이 거부됨, 정상)"
elif [[ "$WEBHOOK_STATUS" == "200" || "$WEBHOOK_STATUS" == "400" ]]; then
  pass "웹훅 엔드포인트 응답 (HTTP $WEBHOOK_STATUS)"
else
  warn "웹훅 엔드포인트 비정상 응답 (HTTP $WEBHOOK_STATUS)"
  info "GitHub App 설정에서 Webhook URL이 $APP_URL/api/webhooks/github 인지 확인"
fi

# ─────────────────────────────────────────────
echo ""
echo "6. 환경 변수 (로컬)"
echo "─────────────────────────────────────────────"
check_env() {
  local var_name=$1
  local required=$2
  if [[ -n "${!var_name:-}" ]]; then
    pass "$var_name 설정됨"
  elif [[ "$required" == "required" ]]; then
    fail "$var_name 미설정"
  else
    warn "$var_name 미설정 (선택사항)"
  fi
}

# CRON_SECRET은 크론잡 수동 실행에 필요
if [[ -n "${CRON_SECRET:-}" ]]; then
  pass "CRON_SECRET 설정됨"
else
  warn "CRON_SECRET 미설정 — 크론잡 수동 테스트 시 필요"
  info "Vercel 대시보드 → Settings → Environment Variables에서 확인 후:"
  info "  export CRON_SECRET=<값>"
fi

# ─────────────────────────────────────────────
echo ""
echo "7. Git 리포 상태"
echo "─────────────────────────────────────────────"
if git rev-parse --is-inside-work-tree &>/dev/null; then
  BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
  CLEAN=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
  pass "Git 리포 내부 (브랜치: $BRANCH)"
  if [[ "$CLEAN" == "0" ]]; then
    pass "워킹 트리 깨끗함"
  else
    warn "커밋되지 않은 변경사항 ${CLEAN}개"
  fi
else
  fail "Git 리포가 아님"
fi

# ─────────────────────────────────────────────
echo ""
echo "8. 필요 도구"
echo "─────────────────────────────────────────────"
for tool in gh curl jq git; do
  if command -v "$tool" &>/dev/null; then
    pass "$tool 설치됨"
  else
    fail "$tool 미설치"
  fi
done

# ─────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo -e "  결과: ${GREEN}통과 $PASS${NC} / ${RED}실패 $FAIL${NC} / ${YELLOW}경고 $WARN${NC}"
echo "══════════════════════════════════════════════════════════"

if [[ $FAIL -gt 0 ]]; then
  echo ""
  echo -e "  ${RED}실패 항목을 해결한 후 테스트를 진행하세요.${NC}"
  echo ""
  exit 1
else
  echo ""
  echo -e "  ${GREEN}전제 조건 충족! 테스트를 진행할 수 있습니다.${NC}"
  if [[ $WARN -gt 0 ]]; then
    echo -e "  ${YELLOW}경고 항목은 일부 테스트 시나리오에 영향을 줄 수 있습니다.${NC}"
  fi
  echo ""
  exit 0
fi

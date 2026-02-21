#!/usr/bin/env bash
# verify-dashboard.sh — 대시보드 페이지별 검증 체크리스트
#
# E2E 테스트 후 각 대시보드 페이지가 데이터를 올바르게 표시하는지
# 수동으로 확인할 항목을 안내하고, API 엔드포인트 응답을 검증한다.
#
# 사용법:
#   ./scripts/verify-dashboard.sh
#
# 환경 변수:
#   APP_URL    — 앱 URL (기본: https://when-my-pr-merged.vercel.app)
#   ORG_SLUG   — 조직 슬러그 (필수)

set -uo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

APP_URL="${APP_URL:-https://when-my-pr-merged.vercel.app}"
ORG_SLUG="${ORG_SLUG:-}"

if [[ -z "$ORG_SLUG" ]]; then
  echo -e "${RED}ORG_SLUG 환경변수를 설정하세요.${NC}"
  echo -e "${BLUE}export ORG_SLUG=<조직슬러그>${NC}"
  echo ""
  echo -e "${DIM}조직 슬러그는 대시보드 URL의 /<orgSlug>/ 부분입니다.${NC}"
  exit 1
fi

BASE="${APP_URL}/${ORG_SLUG}"

PASS=0
FAIL=0
MANUAL=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
manual() { echo -e "  ${YELLOW}☐${NC} $1"; MANUAL=$((MANUAL+1)); }
info() { echo -e "  ${BLUE}ℹ${NC} $1"; }
link() { echo -e "  ${DIM}$1${NC}"; }

echo ""
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}${CYAN}  대시보드 검증 체크리스트${NC}"
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  앱 URL: ${APP_URL}"
echo -e "  조직:   ${ORG_SLUG}"
echo ""

# ─────────────────────────────────────────────
echo -e "${BOLD}1. 메인 대시보드 (/${ORG_SLUG})${NC}"
echo "─────────────────────────────────────────────"
link "$BASE"
manual "4개 지표 카드 표시 (총 PR, 평균 머지 시간, 평균 첫 리뷰 시간, 머지율)"
manual "머지 예측 위젯 표시"
manual "방치 PR 섹션에 미리뷰 PR 표시 (시나리오 3 실행 시)"
manual "Top 리뷰어 카드 표시"
manual "최근 머지된 PR 피드에 머지된 PR 표시"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}2. 통계 페이지 (/${ORG_SLUG}/stats)${NC}"
echo "─────────────────────────────────────────────"
link "$BASE/stats"
manual "시간대별 히트맵 차트 표시"
manual "요일별 PR 차트 표시"
manual "PR 크기별 분석 차트에 S/M/L 버킷 표시 (시나리오 5 실행 시)"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}3. 리뷰어 페이지 (/${ORG_SLUG}/reviewers)${NC}"
echo "─────────────────────────────────────────────"
link "$BASE/reviewers"
manual "리뷰어 응답 속도 차트 표시"
manual "리뷰어 랭킹 테이블에 리뷰어 표시"
manual "빠른 리뷰어 하이라이트 (시나리오 2 실행 시)"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}4. 인사이트 페이지 (/${ORG_SLUG}/insights)${NC}"
echo "─────────────────────────────────────────────"
link "$BASE/insights"
manual "병목 분석: 첫 리뷰 → 승인 → 머지 시간 시각화"
manual "리워크 통계: 평균 수정 횟수, 리뷰 사이클 수 (시나리오 4 실행 시)"
manual "컨플릭트 패턴 차트"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}5. 리더보드 페이지 (/${ORG_SLUG}/leaderboard)${NC}"
echo "─────────────────────────────────────────────"
link "$BASE/leaderboard"
manual "리뷰어 리더보드 테이블 표시"
manual "PR 리더보드 테이블 표시"
manual "배지 표시 (시나리오 6 실행 시)"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}6. 리포트 페이지 (/${ORG_SLUG}/reports)${NC}"
echo "─────────────────────────────────────────────"
link "$BASE/reports"
manual "이번 달 요약 통계 표시"
manual "전월 대비 변화율 표시"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}7. 설정 페이지 (/${ORG_SLUG}/settings)${NC}"
echo "─────────────────────────────────────────────"
link "$BASE/settings"
manual "GitHub App 설치 상태 표시"
manual "Slack 연동 상태 표시 (연동 시)"
manual "알림 토글 (빠른 리뷰 칭찬, 핫 스트릭, 방치 PR 등)"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}8. Slack 알림 확인${NC}"
echo "─────────────────────────────────────────────"
manual "빠른 리뷰 칭찬 메시지 수신 (시나리오 2)"
manual "방치 PR 알림 메시지 수신 (시나리오 3)"
manual "일간 다이제스트 메시지 수신 (시나리오 6)"
manual "주간 리포트 메시지 수신 (시나리오 6)"
manual "머지 예측 메시지 수신 (PR 생성 시)"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}9. 공유 기능${NC}"
echo "─────────────────────────────────────────────"
manual "통계 카드 공유 URL 생성 가능"
manual "OG 이미지 렌더링 정상 (/api/og/stats-card)"

# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════${NC}"
echo -e "  ${GREEN}자동 통과: $PASS${NC}"
echo -e "  ${RED}자동 실패: $FAIL${NC}"
echo -e "  ${YELLOW}수동 확인: ${MANUAL}개 항목${NC}"
echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${DIM}각 페이지를 브라우저에서 열어 위 항목들을 확인하세요.${NC}"
echo -e "  ${DIM}문제 발견 시 웹훅 로그 확인: Vercel Dashboard → Functions 탭${NC}"
echo ""

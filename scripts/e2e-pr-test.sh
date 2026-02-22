#!/usr/bin/env bash
# e2e-pr-test.sh — 실제 PR로 전체 기능 E2E 테스트
#
# 사용법:
#   ./scripts/e2e-pr-test.sh [시나리오번호]
#
#   ./scripts/e2e-pr-test.sh        # 전체 시나리오 순서대로 실행
#   ./scripts/e2e-pr-test.sh 1      # 시나리오 1만 실행
#   ./scripts/e2e-pr-test.sh 1,2,4  # 시나리오 1, 2, 4 실행
#
# 환경 변수:
#   APP_URL        — 앱 URL (기본: https://when-my-pr-merged.vercel.app)
#   REPO           — 테스트 리포 (기본: Hwangwonuk/when-my-pr-merged)
#   CRON_SECRET    — 크론잡 인증 토큰 (시나리오 3, 6에 필요)
#   AUTO_CLEANUP   — "true"면 테스트 후 자동 정리 (기본: false)
#   REVIEWER       — 리뷰어 GitHub ID (기본: 없음, 시나리오 2, 4에 필요)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

APP_URL="${APP_URL:-https://when-my-pr-merged.vercel.app}"
REPO="${REPO:-Hwangwonuk/when-my-pr-merged}"
AUTO_CLEANUP="${AUTO_CLEANUP:-false}"
REVIEWER="${REVIEWER:-}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TEST_PREFIX="test/e2e-${TIMESTAMP}"

# 생성된 리소스 추적 (정리용)
CREATED_BRANCHES=()
CREATED_PRS=()

cleanup() {
  if [[ "$AUTO_CLEANUP" == "true" && ${#CREATED_PRS[@]} -gt 0 ]]; then
    echo ""
    echo -e "${YELLOW}정리 중...${NC}"
    for pr_num in "${CREATED_PRS[@]}"; do
      gh pr close "$pr_num" --repo "$REPO" --delete-branch 2>/dev/null || true
    done
    for branch in "${CREATED_BRANCHES[@]}"; do
      git push origin --delete "$branch" 2>/dev/null || true
    done
    echo -e "${GREEN}정리 완료${NC}"
  fi
}

trap cleanup EXIT

# ─────────────────────────────────────────────
# 유틸리티 함수
# ─────────────────────────────────────────────

header() {
  echo ""
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════${NC}"
  echo -e "${BOLD}${CYAN}  $1${NC}"
  echo -e "${BOLD}${CYAN}══════════════════════════════════════════════════════════${NC}"
  echo ""
}

step() {
  echo -e "  ${BLUE}→${NC} $1"
}

success() {
  echo -e "  ${GREEN}✓${NC} $1"
}

error() {
  echo -e "  ${RED}✗${NC} $1"
}

waiting() {
  echo -e "  ${YELLOW}⏳${NC} $1"
}

pause_for_webhook() {
  local seconds="${1:-5}"
  waiting "웹훅 처리 대기 중 (${seconds}초)..."
  sleep "$seconds"
}

# PR 생성 헬퍼
create_test_branch() {
  local branch_name=$1
  local file_path=$2
  local content=$3
  local commit_msg=$4

  step "브랜치 생성: $branch_name"
  git checkout -b "$branch_name" 2>/dev/null

  mkdir -p "$(dirname "$file_path")"
  echo "$content" > "$file_path"
  git add -f "$file_path"
  git commit -m "$commit_msg" --no-verify 2>/dev/null
  git push origin "$branch_name" 2>/dev/null

  CREATED_BRANCHES+=("$branch_name")
  git checkout main 2>/dev/null
  success "브랜치 push 완료"
}

create_pr() {
  local branch=$1
  local title=$2
  local body=$3

  step "PR 생성: $title"
  local pr_url
  pr_url=$(gh pr create \
    --repo "$REPO" \
    --head "$branch" \
    --title "$title" \
    --body "$body" \
    2>/dev/null)

  local pr_num
  pr_num=$(echo "$pr_url" | grep -o '[0-9]*$')
  CREATED_PRS+=("$pr_num")
  success "PR #${pr_num} 생성 완료: $pr_url"
  echo "$pr_num"
}

wait_and_verify() {
  local description=$1
  pause_for_webhook 5
  echo ""
  echo -e "  ${BOLD}검증: $description${NC}"
  echo -e "  ${BLUE}대시보드에서 확인하세요: ${APP_URL}${NC}"
  echo ""
}

prompt_continue() {
  echo ""
  echo -e "  ${YELLOW}계속하려면 Enter를 누르세요 (q: 중단)${NC}"
  read -r response
  if [[ "$response" == "q" || "$response" == "Q" ]]; then
    echo -e "${RED}테스트 중단${NC}"
    exit 0
  fi
}

# ─────────────────────────────────────────────
# 시나리오 1: 기본 PR 생성 → 리뷰 → 머지
# ─────────────────────────────────────────────

scenario_1() {
  header "시나리오 1: 기본 PR 생성 → 리뷰 → 머지"
  echo "  목적: 핵심 파이프라인 검증 (웹훅 수신 → 데이터 저장 → 대시보드 표시)"
  echo ""

  local branch="${TEST_PREFIX}/basic-flow"
  local file="test-data/scenario1-${TIMESTAMP}.md"
  local content="# E2E Test - Scenario 1\nBasic PR flow test\nTimestamp: ${TIMESTAMP}\n\nThis file tests the basic PR pipeline."

  # Step 1: 브랜치 + PR 생성
  create_test_branch "$branch" "$file" "$content" "test: basic PR flow (scenario 1)"

  local pr_num
  pr_num=$(create_pr "$branch" "[Test] 기본 PR 흐름 테스트 #${TIMESTAMP}" \
    "## E2E 테스트 - 시나리오 1\n\n기본 PR 생성 → 리뷰 → 머지 파이프라인 검증\n\n- PR 생성 웹훅 처리\n- 대시보드 반영\n- 머지 시간 계산")

  wait_and_verify "대시보드에서 총 PR 수 증가 확인"

  # Step 2: 리뷰 요청 (리뷰어가 설정된 경우)
  if [[ -n "$REVIEWER" ]]; then
    step "리뷰어 요청: $REVIEWER"
    gh pr edit "$pr_num" --repo "$REPO" --add-reviewer "$REVIEWER" 2>/dev/null || true
    success "리뷰어 요청 완료"

    echo ""
    echo -e "  ${YELLOW}리뷰어($REVIEWER)가 PR을 리뷰해야 합니다.${NC}"
    echo -e "  ${YELLOW}GitHub에서 리뷰 제출 후 Enter를 누르세요.${NC}"
    prompt_continue
  else
    echo ""
    echo -e "  ${YELLOW}리뷰어가 설정되지 않았습니다 (REVIEWER 환경변수 설정 가능).${NC}"
    echo -e "  ${YELLOW}GitHub UI에서 직접 리뷰를 요청하고 제출한 후 Enter를 누르세요.${NC}"
    echo -e "  ${BLUE}PR: https://github.com/${REPO}/pull/${pr_num}${NC}"
    prompt_continue
  fi

  # Step 3: PR 머지
  step "PR 머지"
  gh pr merge "$pr_num" --repo "$REPO" --merge --delete-branch 2>/dev/null
  success "PR #${pr_num} 머지 완료"

  wait_and_verify "대시보드 확인 사항:
    - 메인 대시보드: 평균 머지 시간, 평균 첫 리뷰 시간, 머지율
    - 리뷰어 랭킹: 리뷰어 표시
    - 최근 머지된 PR 피드: 머지된 PR 표시
    - 리포트: 이번 달 요약에 반영"

  prompt_continue
}

# ─────────────────────────────────────────────
# 시나리오 2: 빠른 리뷰 (30분 내) → Slack 칭찬 알림
# ─────────────────────────────────────────────

scenario_2() {
  header "시나리오 2: 빠른 리뷰 → Slack 칭찬 알림"
  echo "  목적: 빠른 리뷰 자동 칭찬 알림 테스트"
  echo "  주의: Slack 연동 + autoPraiseEnabled=true 필요"
  echo ""

  if [[ -z "$REVIEWER" ]]; then
    error "REVIEWER 환경변수 필요 — 빠른 리뷰 시나리오에는 리뷰어가 필수"
    echo -e "  ${BLUE}export REVIEWER=<github-username> 으로 설정${NC}"
    return 1
  fi

  local branch="${TEST_PREFIX}/fast-review"
  local file="test-data/scenario2-${TIMESTAMP}.md"
  local content="# E2E Test - Scenario 2\nFast review test\nTimestamp: ${TIMESTAMP}"

  # Step 1: PR 생성 + 즉시 리뷰 요청
  create_test_branch "$branch" "$file" "$content" "test: fast review scenario"

  local pr_num
  pr_num=$(create_pr "$branch" "[Test] 빠른 리뷰 테스트 #${TIMESTAMP}" \
    "## E2E 테스트 - 시나리오 2\n\n빠른 리뷰(30분 내) → Slack 칭찬 알림 검증")

  step "리뷰어 요청: $REVIEWER"
  gh pr edit "$pr_num" --repo "$REPO" --add-reviewer "$REVIEWER" 2>/dev/null || true
  success "리뷰어 요청 완료"

  echo ""
  echo -e "  ${BOLD}${YELLOW}⚡ 지금 바로 리뷰를 제출하세요! (30분 내)${NC}"
  echo -e "  ${BLUE}PR: https://github.com/${REPO}/pull/${pr_num}${NC}"
  echo ""
  echo -e "  ${YELLOW}리뷰 제출 후 Enter를 누르세요.${NC}"
  prompt_continue

  # Step 2: 머지
  step "PR 머지"
  gh pr merge "$pr_num" --repo "$REPO" --merge --delete-branch 2>/dev/null
  success "PR #${pr_num} 머지 완료"

  wait_and_verify "Slack 채널에 빠른 리뷰 칭찬 메시지 전송 확인
    (autoPraiseEnabled=true 설정 필요)"

  prompt_continue
}

# ─────────────────────────────────────────────
# 시나리오 3: 방치된 PR → 방치 PR 알림
# ─────────────────────────────────────────────

scenario_3() {
  header "시나리오 3: 방치된 PR → 방치 PR 알림"
  echo "  목적: 방치 PR 감지 + 대시보드 표시 + Slack 알림"
  echo "  참고: 실제 방치는 24시간+ 필요하지만, 크론잡 수동 실행으로 테스트 가능"
  echo ""

  local branch="${TEST_PREFIX}/stale-pr"
  local file="test-data/scenario3-${TIMESTAMP}.md"
  local content="# E2E Test - Scenario 3\nStale PR test - 이 PR은 의도적으로 방치됩니다.\nTimestamp: ${TIMESTAMP}"

  # Step 1: PR 생성 (리뷰 요청 없이)
  create_test_branch "$branch" "$file" "$content" "test: stale PR scenario"

  local pr_num
  pr_num=$(create_pr "$branch" "[Test] 방치 PR 테스트 #${TIMESTAMP}" \
    "## E2E 테스트 - 시나리오 3\n\n이 PR은 의도적으로 리뷰 없이 방치됩니다.\n방치 PR 감지 기능 검증용.")

  success "PR #${pr_num} 생성됨 — 리뷰 요청 없이 방치"

  echo ""
  echo -e "  ${BLUE}대시보드에서 '방치 PR' 섹션 확인: ${APP_URL}${NC}"

  # Step 2: 크론잡 수동 실행 (CRON_SECRET 필요)
  if [[ -n "${CRON_SECRET:-}" ]]; then
    echo ""
    step "방치 PR 크론잡 수동 실행"
    local response
    response=$(curl -s -w "\n%{http_code}" \
      -H "Authorization: Bearer ${CRON_SECRET}" \
      "${APP_URL}/api/cron/stale-prs" 2>/dev/null)

    local http_code
    http_code=$(echo "$response" | tail -1)
    local body
    body=$(echo "$response" | head -n -1)

    if [[ "$http_code" == "200" ]]; then
      success "크론잡 실행 완료 (HTTP 200)"
      echo -e "  ${BLUE}응답: $body${NC}"
    else
      error "크론잡 실행 실패 (HTTP $http_code)"
      echo -e "  ${RED}응답: $body${NC}"
    fi
  else
    echo ""
    echo -e "  ${YELLOW}CRON_SECRET 미설정 — 크론잡 수동 실행을 건너뜁니다.${NC}"
    echo -e "  ${BLUE}수동 실행: curl -H \"Authorization: Bearer \$CRON_SECRET\" ${APP_URL}/api/cron/stale-prs${NC}"
  fi

  echo ""
  echo -e "  ${YELLOW}이 PR은 정리 시까지 열린 상태로 유지됩니다.${NC}"
  echo -e "  ${YELLOW}정리: ./scripts/test-cleanup.sh 또는 AUTO_CLEANUP=true 재실행${NC}"
  prompt_continue
}

# ─────────────────────────────────────────────
# 시나리오 4: Changes Requested → 수정 → 재리뷰 → 머지
# ─────────────────────────────────────────────

scenario_4() {
  header "시나리오 4: Changes Requested → 수정 → 재리뷰 → 머지"
  echo "  목적: 리비전 카운트, 리뷰 사이클 카운트 검증"
  echo ""

  if [[ -z "$REVIEWER" ]]; then
    error "REVIEWER 환경변수 필요"
    return 1
  fi

  local branch="${TEST_PREFIX}/review-cycle"
  local file="test-data/scenario4-${TIMESTAMP}.md"
  local content="# E2E Test - Scenario 4\nReview cycle test - v1\nTimestamp: ${TIMESTAMP}"

  # Step 1: PR 생성 + 리뷰 요청
  create_test_branch "$branch" "$file" "$content" "test: review cycle scenario v1"

  local pr_num
  pr_num=$(create_pr "$branch" "[Test] 리뷰 사이클 테스트 #${TIMESTAMP}" \
    "## E2E 테스트 - 시나리오 4\n\n리비전 카운트, 리뷰 사이클 카운트 검증\n\n1. Changes Requested\n2. 코드 수정 push\n3. 재리뷰 → Approved\n4. 머지")

  step "리뷰어 요청: $REVIEWER"
  gh pr edit "$pr_num" --repo "$REPO" --add-reviewer "$REVIEWER" 2>/dev/null || true

  echo ""
  echo -e "  ${BOLD}${YELLOW}Step 1: 리뷰어가 CHANGES_REQUESTED 리뷰를 제출해야 합니다${NC}"
  echo -e "  ${BLUE}PR: https://github.com/${REPO}/pull/${pr_num}${NC}"
  echo -e "  ${YELLOW}리뷰 제출 후 Enter를 누르세요.${NC}"
  prompt_continue

  # Step 2: 코드 수정 push (synchronize 이벤트 발생 → revisionCount 증가)
  step "코드 수정 push (revisionCount 증가 예상)"
  git checkout "$branch" 2>/dev/null
  local updated_content="# E2E Test - Scenario 4\nReview cycle test - v2 (수정됨)\nTimestamp: ${TIMESTAMP}\n\n## 변경 사항\n- 리뷰 피드백 반영"
  echo "$updated_content" > "$file"
  git add "$file"
  git commit -m "test: apply review feedback (scenario 4 v2)" --no-verify 2>/dev/null
  git push origin "$branch" 2>/dev/null
  git checkout main 2>/dev/null
  success "수정 push 완료 (synchronize 이벤트 발생)"

  pause_for_webhook 5

  echo ""
  echo -e "  ${BOLD}${YELLOW}Step 2: 리뷰어가 APPROVED 리뷰를 제출해야 합니다${NC}"
  echo -e "  ${YELLOW}리뷰 제출 후 Enter를 누르세요.${NC}"
  prompt_continue

  # Step 3: 머지
  step "PR 머지"
  gh pr merge "$pr_num" --repo "$REPO" --merge --delete-branch 2>/dev/null
  success "PR #${pr_num} 머지 완료"

  wait_and_verify "대시보드 확인 사항:
    - 인사이트 페이지: 병목 분석 (첫 리뷰 → 승인 → 머지 시간)
    - 평균 수정 횟수 (revisionCount >= 1)
    - 리뷰 사이클 수 (reviewCycleCount >= 1)"

  prompt_continue
}

# ─────────────────────────────────────────────
# 시나리오 5: 다양한 크기의 PR
# ─────────────────────────────────────────────

scenario_5() {
  header "시나리오 5: 다양한 크기의 PR (S/M/L)"
  echo "  목적: PR 크기별 분석 차트 검증"
  echo ""

  local sizes=("small" "medium" "large")
  local lines=(50 200 400)
  local labels=("S (50줄)" "M (200줄)" "L (400줄)")

  for i in "${!sizes[@]}"; do
    local size="${sizes[$i]}"
    local line_count="${lines[$i]}"
    local label="${labels[$i]}"
    local branch="${TEST_PREFIX}/size-${size}"
    local file="test-data/scenario5-${size}-${TIMESTAMP}.txt"

    step "PR 생성: ${label}"

    # 해당 줄 수의 콘텐츠 생성
    git checkout -b "$branch" 2>/dev/null
    mkdir -p "$(dirname "$file")"
    {
      echo "# E2E Test - Scenario 5 - Size $(echo "$size" | tr '[:lower:]' '[:upper:]')"
      echo "# Timestamp: ${TIMESTAMP}"
      echo "# Line count target: ${line_count}"
      echo ""
      for ((j=1; j<=line_count; j++)); do
        echo "Line $j: This is test content for PR size analysis. The quick brown fox jumps over the lazy dog. Size: ${size}."
      done
    } > "$file"

    git add -f "$file"
    git commit -m "test: ${size} PR (${line_count} lines) for size analysis" --no-verify 2>/dev/null
    git push origin "$branch" 2>/dev/null
    CREATED_BRANCHES+=("$branch")
    git checkout main 2>/dev/null

    local pr_num
    pr_num=$(create_pr "$branch" "[Test] ${label} PR 크기 테스트 #${TIMESTAMP}" \
      "## E2E 테스트 - 시나리오 5\n\nPR 크기: ${label}\n크기별 분석 차트 검증용")

    # 바로 머지 (크기 분석만 필요)
    step "PR #${pr_num} 머지"
    gh pr merge "$pr_num" --repo "$REPO" --merge --delete-branch 2>/dev/null
    success "PR #${pr_num} (${label}) 머지 완료"

    pause_for_webhook 3
  done

  wait_and_verify "통계 페이지에서 PR 크기 차트에 S/M/L 버킷 표시 확인"
  prompt_continue
}

# ─────────────────────────────────────────────
# 시나리오 6: 크론잡 수동 실행
# ─────────────────────────────────────────────

scenario_6() {
  header "시나리오 6: 크론잡 수동 실행"
  echo "  목적: 다이제스트, 주간 리포트, 배지 수여 검증"
  echo ""

  if [[ -z "${CRON_SECRET:-}" ]]; then
    error "CRON_SECRET 미설정 — 이 시나리오를 실행할 수 없습니다"
    echo -e "  ${BLUE}export CRON_SECRET=<값> 으로 설정 후 재시도${NC}"
    return 1
  fi

  local cron_jobs=(
    "daily-digest:일간 다이제스트"
    "weekly-report:주간 리포트"
    "badge-awards:배지 수여"
    "stale-prs:방치 PR 알림"
  )

  for job_info in "${cron_jobs[@]}"; do
    local job="${job_info%%:*}"
    local label="${job_info##*:}"

    step "${label} 실행: /api/cron/${job}"

    local response
    response=$(curl -s -w "\n%{http_code}" \
      -H "Authorization: Bearer ${CRON_SECRET}" \
      "${APP_URL}/api/cron/${job}" 2>/dev/null)

    local http_code
    http_code=$(echo "$response" | tail -1)
    local body
    body=$(echo "$response" | head -n -1)

    if [[ "$http_code" == "200" ]]; then
      success "${label} 완료 (HTTP 200): $body"
    else
      error "${label} 실패 (HTTP $http_code): $body"
    fi

    sleep 2
  done

  echo ""
  echo -e "  ${BOLD}검증 사항:${NC}"
  echo -e "  ${BLUE}• Slack 채널: 다이제스트/리포트 메시지 수신 확인${NC}"
  echo -e "  ${BLUE}• 리더보드 페이지: 배지 표시 확인 (${APP_URL})${NC}"
  prompt_continue
}

# ─────────────────────────────────────────────
# 메인 실행
# ─────────────────────────────────────────────

header "E2E PR 테스트 스위트"
echo "  앱 URL:    $APP_URL"
echo "  테스트 리포: $REPO"
echo "  리뷰어:    ${REVIEWER:-미설정}"
echo "  크론 시크릿: ${CRON_SECRET:+설정됨}${CRON_SECRET:-미설정}"
echo "  자동 정리: $AUTO_CLEANUP"
echo "  타임스탬프: $TIMESTAMP"

SCENARIOS="${1:-1,2,3,4,5,6}"
IFS=',' read -ra SELECTED <<< "$SCENARIOS"

echo ""
echo -e "  실행할 시나리오: ${SELECTED[*]}"
echo ""
echo -e "  ${YELLOW}계속하려면 Enter, 중단은 Ctrl+C${NC}"
read -r

for scenario in "${SELECTED[@]}"; do
  scenario=$(echo "$scenario" | tr -d ' ')
  case "$scenario" in
    1) scenario_1 ;;
    2) scenario_2 ;;
    3) scenario_3 ;;
    4) scenario_4 ;;
    5) scenario_5 ;;
    6) scenario_6 ;;
    *) error "알 수 없는 시나리오: $scenario" ;;
  esac
done

header "테스트 완료"

echo "  생성된 PR: ${#CREATED_PRS[@]}개"
echo "  생성된 브랜치: ${#CREATED_BRANCHES[@]}개"
echo ""

if [[ "$AUTO_CLEANUP" != "true" && ${#CREATED_PRS[@]} -gt 0 ]]; then
  echo -e "  ${YELLOW}테스트 리소스 정리:${NC}"
  echo -e "  ${BLUE}  ./scripts/test-cleanup.sh${NC}"
  echo -e "  ${BLUE}  또는 AUTO_CLEANUP=true로 재실행${NC}"
fi

echo ""
echo -e "  ${BOLD}대시보드 검증 체크리스트:${NC}"
echo -e "  ${BLUE}  ./scripts/verify-dashboard.sh${NC}"
echo ""

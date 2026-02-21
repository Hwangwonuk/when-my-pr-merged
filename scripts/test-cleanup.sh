#!/usr/bin/env bash
# test-cleanup.sh — E2E 테스트 후 리소스 정리
#
# 테스트로 생성된 PR(열린 상태)과 브랜치를 정리한다.
#
# 사용법:
#   ./scripts/test-cleanup.sh           # 테스트 PR/브랜치 정리
#   ./scripts/test-cleanup.sh --dry-run # 정리 대상만 확인 (실제 삭제 안함)
#
# 환경 변수:
#   REPO — 테스트 리포 (기본: Hwangwonuk/when-my-pr-merged)

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

REPO="${REPO:-Hwangwonuk/when-my-pr-merged}"
DRY_RUN=false

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
fi

echo ""
echo -e "${BOLD}E2E 테스트 리소스 정리${NC}"
echo "═══════════════════════════════════════"
if $DRY_RUN; then
  echo -e "${YELLOW}(Dry run — 실제 삭제 없음)${NC}"
fi
echo ""

# ─────────────────────────────────────────────
# 1. 테스트 PR 정리 (열린 상태인 것만)
# ─────────────────────────────────────────────
echo -e "${BOLD}1. 열린 테스트 PR${NC}"
echo "─────────────────────────────────────────"

OPEN_TEST_PRS=$(gh pr list --repo "$REPO" --state open --json number,title,headRefName \
  --jq '.[] | select(.title | test("\\[Test\\]")) | "\(.number)\t\(.headRefName)\t\(.title)"' 2>/dev/null || echo "")

if [[ -z "$OPEN_TEST_PRS" ]]; then
  echo -e "  ${GREEN}정리할 테스트 PR 없음${NC}"
else
  PR_COUNT=0
  while IFS=$'\t' read -r pr_num branch title; do
    echo -e "  ${BLUE}PR #${pr_num}${NC}: $title"
    echo -e "  ${BLUE}  브랜치: $branch${NC}"

    if ! $DRY_RUN; then
      gh pr close "$pr_num" --repo "$REPO" --delete-branch 2>/dev/null && \
        echo -e "  ${GREEN}✓ 닫기 + 브랜치 삭제 완료${NC}" || \
        echo -e "  ${RED}✗ 닫기 실패${NC}"
    fi
    ((PR_COUNT++))
  done <<< "$OPEN_TEST_PRS"
  echo ""
  echo -e "  총 ${PR_COUNT}개 테스트 PR 발견"
fi

# ─────────────────────────────────────────────
# 2. 테스트 브랜치 정리 (원격)
# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}2. 원격 테스트 브랜치${NC}"
echo "─────────────────────────────────────────"

REMOTE_BRANCHES=$(git ls-remote --heads origin 2>/dev/null | grep "refs/heads/test/" | awk '{print $2}' | sed 's|refs/heads/||' || echo "")

if [[ -z "$REMOTE_BRANCHES" ]]; then
  echo -e "  ${GREEN}정리할 테스트 브랜치 없음${NC}"
else
  BRANCH_COUNT=0
  while read -r branch; do
    echo -e "  ${BLUE}$branch${NC}"
    if ! $DRY_RUN; then
      git push origin --delete "$branch" 2>/dev/null && \
        echo -e "  ${GREEN}✓ 삭제 완료${NC}" || \
        echo -e "  ${RED}✗ 삭제 실패${NC}"
    fi
    ((BRANCH_COUNT++))
  done <<< "$REMOTE_BRANCHES"
  echo ""
  echo -e "  총 ${BRANCH_COUNT}개 테스트 브랜치 발견"
fi

# ─────────────────────────────────────────────
# 3. 로컬 테스트 브랜치 정리
# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}3. 로컬 테스트 브랜치${NC}"
echo "─────────────────────────────────────────"

LOCAL_BRANCHES=$(git branch --list 'test/*' 2>/dev/null | sed 's/^[* ]*//' || echo "")

if [[ -z "$LOCAL_BRANCHES" ]]; then
  echo -e "  ${GREEN}정리할 로컬 테스트 브랜치 없음${NC}"
else
  LOCAL_COUNT=0
  while read -r branch; do
    echo -e "  ${BLUE}$branch${NC}"
    if ! $DRY_RUN; then
      git branch -D "$branch" 2>/dev/null && \
        echo -e "  ${GREEN}✓ 삭제 완료${NC}" || \
        echo -e "  ${RED}✗ 삭제 실패${NC}"
    fi
    ((LOCAL_COUNT++))
  done <<< "$LOCAL_BRANCHES"
  echo ""
  echo -e "  총 ${LOCAL_COUNT}개 로컬 테스트 브랜치 발견"
fi

# ─────────────────────────────────────────────
# 4. test-data 디렉토리 정리
# ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}4. test-data 파일${NC}"
echo "─────────────────────────────────────────"

if [[ -d "test-data" ]]; then
  FILE_COUNT=$(find test-data -type f | wc -l | tr -d ' ')
  echo -e "  ${BLUE}test-data/ 디렉토리: ${FILE_COUNT}개 파일${NC}"
  if ! $DRY_RUN; then
    rm -rf test-data
    echo -e "  ${GREEN}✓ test-data/ 삭제 완료${NC}"
  fi
else
  echo -e "  ${GREEN}test-data/ 디렉토리 없음${NC}"
fi

# ─────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════"
if $DRY_RUN; then
  echo -e "${YELLOW}Dry run 완료 — 실제 정리하려면 --dry-run 없이 실행${NC}"
else
  echo -e "${GREEN}정리 완료${NC}"
fi
echo ""

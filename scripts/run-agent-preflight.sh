#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "${HARNESSHUB_PREFLIGHT_ACTIVE:-${CLAWPACK_PREFLIGHT_ACTIVE:-0}}" == "1" ]]; then
  echo "Agent preflight is already running; skipping recursive invocation."
  exit 0
fi
export HARNESSHUB_PREFLIGHT_ACTIVE=1
export CLAWPACK_PREFLIGHT_ACTIVE=1

REVIEW_FILE="${HARNESSHUB_REVIEW_FILE:-${CLAWPACK_REVIEW_FILE:-$ROOT_DIR/.codex-review}}"
REVIEW_PROOF_FILE="${HARNESSHUB_REVIEW_PROOF_FILE:-${CLAWPACK_REVIEW_PROOF_FILE:-$ROOT_DIR/.codex-review-proof}}"
BASE_REF="${HARNESSHUB_PREFLIGHT_BASE_REF:-${CLAWPACK_PREFLIGHT_BASE_REF:-upstream/main}}"
RUN_SMOKE="${HARNESSHUB_PREFLIGHT_RUN_SMOKE:-${CLAWPACK_PREFLIGHT_RUN_SMOKE:-0}}"
ENFORCE_ISSUE_STATE="${HARNESSHUB_PREFLIGHT_ENFORCE_ISSUE_STATE:-${CLAWPACK_PREFLIGHT_ENFORCE_ISSUE_STATE:-0}}"
BUILD_COMMAND="${HARNESSHUB_PREFLIGHT_BUILD_COMMAND:-${CLAWPACK_PREFLIGHT_BUILD_COMMAND:-npm run build}}"
TEST_COMMAND="${HARNESSHUB_PREFLIGHT_TEST_COMMAND:-${CLAWPACK_PREFLIGHT_TEST_COMMAND:-npm test}}"
SMOKE_COMMAND="${HARNESSHUB_PREFLIGHT_SMOKE_COMMAND:-${CLAWPACK_PREFLIGHT_SMOKE_COMMAND:-./scripts/run-cli-smoke.sh}}"

read_review_proof_value() {
  local key="$1"
  sed -n "s/^${key}=//p" "$REVIEW_PROOF_FILE" | head -n 1
}

read_review_value() {
  local key="$1"
  sed -n "s/^${key}: //p" "$REVIEW_FILE" | head -n 1
}

check_review_note() {
  if [[ ! -f "$REVIEW_FILE" ]]; then
    echo "Preflight failed: missing .codex-review"
    exit 1
  fi

  if ! grep -Eq '^scope reviewed:' "$REVIEW_FILE" \
    || ! grep -Eq '^head reviewed:' "$REVIEW_FILE" \
    || ! grep -Eq '^findings:' "$REVIEW_FILE" \
    || ! grep -Eq '^remaining risks:' "$REVIEW_FILE"; then
    echo "Preflight failed: .codex-review exists but is incomplete"
    exit 1
  fi

  if grep -Fq 'native /review has not been run yet' "$REVIEW_FILE"; then
    echo "Preflight failed: .codex-review still contains the checkpoint placeholder"
    exit 1
  fi
}

check_review_proof() {
  local current_head proof_head proof_branch current_branch reviewed_head

  if [[ ! -f "$REVIEW_PROOF_FILE" ]]; then
    echo "Preflight failed: missing .codex-review-proof"
    exit 1
  fi

  current_head="$(git rev-parse HEAD)"
  current_branch="$(git branch --show-current)"
  proof_head="$(read_review_proof_value head_sha)"
  proof_branch="$(read_review_proof_value branch)"

  if [[ -z "$proof_head" ]]; then
    echo "Preflight failed: .codex-review-proof is missing head_sha"
    exit 1
  fi

  if [[ "$proof_head" != "$current_head" ]]; then
    echo "Preflight failed: .codex-review-proof does not match the current HEAD"
    exit 1
  fi

  if [[ -n "$current_branch" ]] && [[ -n "$proof_branch" ]] && [[ "$proof_branch" != "$current_branch" ]]; then
    echo "Preflight failed: .codex-review-proof was generated for a different branch"
    exit 1
  fi

  reviewed_head="$(read_review_value "head reviewed")"
  if [[ -z "$reviewed_head" ]]; then
    echo "Preflight failed: .codex-review is missing head reviewed"
    exit 1
  fi

  if [[ "$reviewed_head" != "$current_head" ]]; then
    echo "Preflight failed: .codex-review does not record the current HEAD"
    exit 1
  fi
}

check_branch_freshness() {
  if [[ "${BYPASS_BRANCH_FRESHNESS_CHECK:-}" == "1" ]]; then
    echo "Bypassing branch freshness check because BYPASS_BRANCH_FRESHNESS_CHECK=1"
    return 0
  fi

  if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
    echo "Skipping branch freshness check: base ref $BASE_REF is unavailable"
    return 0
  fi

  if ! git merge-base --is-ancestor "$BASE_REF" HEAD; then
    echo "Preflight failed: current branch does not contain the latest $BASE_REF"
    exit 1
  fi
}

check_issue_state() {
  local output status
  set +e
  output="$(node "$ROOT_DIR/scripts/codex-pm.mjs" issue-state-check 2>&1)"
  status=$?
  set -e

  if [[ $status -eq 0 ]]; then
    echo "$output"
    return 0
  fi

  echo "$output"
  if [[ "$ENFORCE_ISSUE_STATE" == "1" ]]; then
    exit 1
  fi
  echo "Continuing without enforced issue-state check. Set HARNESSHUB_PREFLIGHT_ENFORCE_ISSUE_STATE=1 to require it."
}

run_local_pr_closure_check() {
  local changed_files pr_body body_input=()

  if ! git rev-parse --verify "$BASE_REF" >/dev/null 2>&1; then
    echo "Skipping PR closure sync check: base ref $BASE_REF is unavailable"
    return 0
  fi

  changed_files="$(git diff --name-only "$BASE_REF"...HEAD)"
  if [[ -z "$changed_files" ]]; then
    return 0
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "Skipping PR closure sync check: gh is unavailable"
    return 0
  fi

  pr_body="$(gh pr view --json body --jq .body 2>/dev/null || true)"
  if [[ -z "$pr_body" ]]; then
    echo "Skipping PR closure sync check: PR body is unavailable"
    return 0
  fi

  while IFS= read -r changed_path; do
    [[ -n "$changed_path" ]] || continue
    body_input+=("--changed-file" "$changed_path")
  done <<< "$changed_files"

  node "$ROOT_DIR/scripts/codex-pm.mjs" verify-pr-closure-sync --pr-body "$pr_body" "${body_input[@]}"
}

echo "Running agent preflight in $ROOT_DIR"

check_branch_freshness
check_review_note
check_review_proof
check_issue_state

echo "Running build"
bash -lc "$BUILD_COMMAND"

echo "Running tests"
bash -lc "$TEST_COMMAND"

echo "Running local PR closure sync check if PR body is available"
run_local_pr_closure_check

if [[ "$RUN_SMOKE" == "1" ]]; then
  echo "Running CLI smoke validation"
  bash -lc "$SMOKE_COMMAND"
fi

echo "Agent preflight passed."

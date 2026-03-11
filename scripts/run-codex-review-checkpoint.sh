#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

REVIEW_FILE="${CLAWPACK_REVIEW_FILE:-$ROOT_DIR/.codex-review}"
REVIEW_PROOF_FILE="${CLAWPACK_REVIEW_PROOF_FILE:-$ROOT_DIR/.codex-review-proof}"
BASE_REF="${CLAWPACK_REVIEW_BASE_REF:-upstream/main}"
BRANCH_NAME="$(git branch --show-current)"
HEAD_SHA="$(git rev-parse HEAD)"

build_diff_summary() {
  local compare_ref="$1"
  if git rev-parse --verify "$compare_ref" >/dev/null 2>&1; then
    git diff --stat "$compare_ref"...HEAD
    return 0
  fi
  if git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
    git diff --stat HEAD~1...HEAD
    return 0
  fi
  echo "No comparison base available."
}

write_review_proof() {
  cat >"$REVIEW_PROOF_FILE" <<EOF
branch=${BRANCH_NAME:-detached-head}
head_sha=$HEAD_SHA
base_ref=$BASE_REF
generated_at=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
EOF
}

if [[ ! -f "$REVIEW_FILE" ]]; then
  diff_summary="$(build_diff_summary "$BASE_REF")"
  cat >"$REVIEW_FILE" <<EOF
scope reviewed: branch ${BRANCH_NAME:-detached-head}
findings: no findings
remaining risks: native /review has not been run yet

diff summary:
$diff_summary
EOF
  echo "Created review checkpoint template at $REVIEW_FILE"
else
  echo "Review checkpoint already exists at $REVIEW_FILE"
fi

write_review_proof
echo "Refreshed review proof at $REVIEW_PROOF_FILE for HEAD $HEAD_SHA"

cat <<EOF

Next steps:
1. In Codex, run the native /review command for the current branch changes.
2. Update $REVIEW_FILE with the actual review scope, findings, and remaining risks after the review completes.
3. Run ./scripts/run-agent-preflight.sh or push again after the review note is complete.
EOF

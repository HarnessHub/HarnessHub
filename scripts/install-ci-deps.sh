#!/usr/bin/env bash
set -euo pipefail

NPM_BIN="${HARNESSHUB_CI_NPM_BIN:-npm}"
INSTALL_FLAGS=(--no-audit --no-fund)
INSTALL_TIMEOUT_SECONDS="${HARNESSHUB_CI_INSTALL_TIMEOUT_SECONDS:-90}"

run_npm() {
  "$NPM_BIN" "$@"
}

ensure_vitest() {
  [[ -x node_modules/.bin/vitest ]]
}

run_install_step() {
  local subcommand="$1"
  shift

  if command -v timeout >/dev/null 2>&1; then
    timeout "${INSTALL_TIMEOUT_SECONDS}"s "$NPM_BIN" "$subcommand" "$@"
    return $?
  fi

  run_npm "$subcommand" "$@"
}

attempt_ci_install() {
  if ! run_install_step ci "${INSTALL_FLAGS[@]}"; then
    return 1
  fi

  if ! ensure_vitest; then
    echo "npm ci reported success but vitest is unavailable." >&2
    return 1
  fi

  return 0
}

ci_ok=0
for attempt in 1 2; do
  if attempt_ci_install; then
    ci_ok=1
    break
  fi
  echo "npm ci attempt ${attempt} failed." >&2
done

if [[ "$ci_ok" != "1" ]]; then
  echo "npm ci failed twice; falling back to npm install." >&2
  run_install_step install "${INSTALL_FLAGS[@]}"
fi

if ! ensure_vitest; then
  echo "vitest is unavailable after dependency installation." >&2
  exit 1
fi

echo "CI dependencies installed."

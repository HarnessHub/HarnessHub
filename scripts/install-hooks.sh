#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
git -C "$repo_root" config core.hooksPath .githooks
chmod +x "$repo_root/.githooks/pre-push"

echo "Configured git hooks path to .githooks"
echo "Installed pre-push Codex review hook"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

TMP_DIR="$(mktemp -d)"
SRC_DIR="$TMP_DIR/source"
TARGET_DIR="$TMP_DIR/target"
PACK_FILE="$TMP_DIR/sample.harness"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$SRC_DIR/workspace/skills/demo"
cat >"$SRC_DIR/openclaw.json" <<'EOF'
{
  "agents": {
    "defaults": {
      "workspace": "./workspace"
    },
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "./workspace"
      }
    ]
  }
}
EOF
cat >"$SRC_DIR/workspace/AGENTS.md" <<'EOF'
# Demo Agent
EOF
cat >"$SRC_DIR/workspace/SOUL.md" <<'EOF'
# Soul
EOF
cat >"$SRC_DIR/workspace/skills/demo/SKILL.md" <<'EOF'
---
name: demo
description: demo skill
---
Use the demo skill.
EOF

npm run build >/dev/null

node dist/cli.js inspect -p "$SRC_DIR" -f json >/dev/null
node dist/cli.js export -p "$SRC_DIR" -o "$PACK_FILE" -t template -f json >/dev/null
node dist/cli.js import "$PACK_FILE" -t "$TARGET_DIR" -f json >/dev/null

VERIFY_OUTPUT="$(node dist/cli.js verify -p "$TARGET_DIR" -f json)"
echo "$VERIFY_OUTPUT" | node -e '
const data = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
if (!data.valid) process.exit(1);
const hasManifestSchema = data.checks.some((check) => check.name === "manifest_schema");
if (!hasManifestSchema) {
  console.error("verify did not load persisted manifest");
  process.exit(1);
}
'

echo "CLI smoke passed."

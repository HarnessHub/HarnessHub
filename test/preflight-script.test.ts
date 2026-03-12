import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("run-agent-preflight.sh", () => {
  it("fails without a review note", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-preflight-"));
    const result = spawnSync("./scripts/run-agent-preflight.sh", [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HARNESSHUB_REVIEW_FILE: path.join(tmpDir, ".codex-review"),
        HARNESSHUB_REVIEW_PROOF_FILE: path.join(tmpDir, ".codex-review-proof"),
        HARNESSHUB_PREFLIGHT_BASE_REF: "HEAD",
        HARNESSHUB_PREFLIGHT_ACTIVE: "0",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("missing .codex-review");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("passes with overridden build and test commands", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-preflight-"));
    const branch = spawnSync("git", ["branch", "--show-current"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();

    fs.writeFileSync(path.join(tmpDir, ".codex-review-proof"), `branch=${branch}\nhead_sha=${headSha}\nbase_ref=HEAD\ngenerated_at=2026-03-12T00:00:00Z\n`, "utf8");
    fs.writeFileSync(path.join(tmpDir, ".codex-review"), `scope reviewed: preflight\nhead reviewed: ${headSha}\nfindings: no findings\nremaining risks: smoke skipped\n`, "utf8");

    const result = spawnSync("./scripts/run-agent-preflight.sh", [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HARNESSHUB_REVIEW_FILE: path.join(tmpDir, ".codex-review"),
        HARNESSHUB_REVIEW_PROOF_FILE: path.join(tmpDir, ".codex-review-proof"),
        HARNESSHUB_PREFLIGHT_BASE_REF: "HEAD",
        HARNESSHUB_PREFLIGHT_BUILD_COMMAND: "true",
        HARNESSHUB_PREFLIGHT_TEST_COMMAND: "true",
        HARNESSHUB_PREFLIGHT_ACTIVE: "0",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Agent preflight passed.");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("passes when review note is older than proof but records the current head", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-preflight-"));
    const branch = spawnSync("git", ["branch", "--show-current"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
    const reviewPath = path.join(tmpDir, ".codex-review");
    const proofPath = path.join(tmpDir, ".codex-review-proof");

    fs.writeFileSync(reviewPath, `scope reviewed: preflight\nhead reviewed: ${headSha}\nfindings: no findings\nremaining risks: smoke skipped\n`, "utf8");
    const reviewTime = new Date("2026-03-12T00:00:00Z");
    fs.utimesSync(reviewPath, reviewTime, reviewTime);

    fs.writeFileSync(proofPath, `branch=${branch}\nhead_sha=${headSha}\nbase_ref=HEAD\ngenerated_at=2026-03-12T01:00:00Z\n`, "utf8");
    const proofTime = new Date("2026-03-12T01:00:00Z");
    fs.utimesSync(proofPath, proofTime, proofTime);

    const result = spawnSync("./scripts/run-agent-preflight.sh", [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        HARNESSHUB_REVIEW_FILE: reviewPath,
        HARNESSHUB_REVIEW_PROOF_FILE: proofPath,
        HARNESSHUB_PREFLIGHT_BASE_REF: "HEAD",
        HARNESSHUB_PREFLIGHT_BUILD_COMMAND: "true",
        HARNESSHUB_PREFLIGHT_TEST_COMMAND: "true",
        HARNESSHUB_PREFLIGHT_ACTIVE: "0",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Agent preflight passed.");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("blocks reusing a branch whose PR already merged", () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-preflight-"));
    const branch = spawnSync("git", ["branch", "--show-current"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
    const binDir = path.join(tmpDir, "bin");
    fs.mkdirSync(binDir);
    fs.writeFileSync(path.join(binDir, "gh"), `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "pr" && "$2" == "list" ]]; then
  echo '[{"number":41,"url":"https://github.com/HarnessHub/HarnessHub/pull/41"}]'
  exit 0
fi
echo "unexpected gh invocation: $*" >&2
exit 1
`, "utf8");
    fs.chmodSync(path.join(binDir, "gh"), 0o755);

    fs.writeFileSync(path.join(tmpDir, ".codex-review-proof"), `branch=${branch}\nhead_sha=${headSha}\nbase_ref=HEAD\ngenerated_at=2026-03-12T00:00:00Z\n`, "utf8");
    fs.writeFileSync(path.join(tmpDir, ".codex-review"), `scope reviewed: preflight\nhead reviewed: ${headSha}\nfindings: no findings\nremaining risks: smoke skipped\n`, "utf8");

    const result = spawnSync("./scripts/run-agent-preflight.sh", [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        HARNESSHUB_REVIEW_FILE: path.join(tmpDir, ".codex-review"),
        HARNESSHUB_REVIEW_PROOF_FILE: path.join(tmpDir, ".codex-review-proof"),
        HARNESSHUB_PREFLIGHT_BASE_REF: "HEAD",
        HARNESSHUB_PREFLIGHT_BUILD_COMMAND: "true",
        HARNESSHUB_PREFLIGHT_TEST_COMMAND: "true",
        HARNESSHUB_PREFLIGHT_ACTIVE: "0",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("already has a merged PR");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

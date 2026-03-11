import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

describe("run-agent-preflight.sh", () => {
  it("fails without a review note", () => {
    const repoRoot = "/workspace/02-projects/active/clawpack";
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clawpack-preflight-"));
    const result = spawnSync("./scripts/run-agent-preflight.sh", [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CLAWPACK_REVIEW_FILE: path.join(tmpDir, ".codex-review"),
        CLAWPACK_REVIEW_PROOF_FILE: path.join(tmpDir, ".codex-review-proof"),
        CLAWPACK_PREFLIGHT_BASE_REF: "HEAD",
        CLAWPACK_PREFLIGHT_ACTIVE: "0",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("missing .codex-review");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("passes with overridden build and test commands", () => {
    const repoRoot = "/workspace/02-projects/active/clawpack";
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clawpack-preflight-"));
    const branch = spawnSync("git", ["branch", "--show-current"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();
    const headSha = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" }).stdout.trim();

    fs.writeFileSync(path.join(tmpDir, ".codex-review"), "scope reviewed: preflight\nfindings: no findings\nremaining risks: smoke skipped\n", "utf8");
    fs.writeFileSync(path.join(tmpDir, ".codex-review-proof"), `branch=${branch}\nhead_sha=${headSha}\nbase_ref=HEAD\ngenerated_at=2026-03-12T00:00:00Z\n`, "utf8");

    const result = spawnSync("./scripts/run-agent-preflight.sh", [], {
      cwd: repoRoot,
      env: {
        ...process.env,
        CLAWPACK_REVIEW_FILE: path.join(tmpDir, ".codex-review"),
        CLAWPACK_REVIEW_PROOF_FILE: path.join(tmpDir, ".codex-review-proof"),
        CLAWPACK_PREFLIGHT_BASE_REF: "HEAD",
        CLAWPACK_PREFLIGHT_BUILD_COMMAND: "true",
        CLAWPACK_PREFLIGHT_TEST_COMMAND: "true",
        CLAWPACK_PREFLIGHT_ACTIVE: "0",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Agent preflight passed.");
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

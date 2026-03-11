import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function git(cwd: string, ...args: string[]) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout.trim();
}

function prepareRepo() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "clawpack-hook-"));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.name", "Test User");
  git(repo, "config", "user.email", "test@example.com");
  git(repo, "remote", "add", "origin", "git@github.com:test/clawpack.git");

  const sourceRoot = "/workspace/02-projects/active/clawpack";
  fs.mkdirSync(path.join(repo, ".githooks"), { recursive: true });
  fs.mkdirSync(path.join(repo, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(sourceRoot, ".githooks", "pre-push"), path.join(repo, ".githooks", "pre-push"));
  fs.copyFileSync(path.join(sourceRoot, "scripts", "codex-pm.mjs"), path.join(repo, "scripts", "codex-pm.mjs"));
  fs.chmodSync(path.join(repo, ".githooks", "pre-push"), 0o755);

  fs.mkdirSync(path.join(repo, ".codex", "pm", "tasks", "repository-harness"), { recursive: true });
  fs.writeFileSync(path.join(repo, ".codex", "pm", "tasks", "repository-harness", "bootstrap.md"), `---
type: task
epic: repository-harness
slug: bootstrap
title: Bootstrap harness
status: in_progress
task_type: implementation
issue: 42
---

## Context

Test task.
`, "utf8");

  fs.writeFileSync(path.join(repo, "README.md"), "base\n", "utf8");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "base");
  git(repo, "checkout", "-b", "issue-42-bootstrap");
  fs.appendFileSync(path.join(repo, ".codex", "pm", "tasks", "repository-harness", "bootstrap.md"), "\nMore body.\n");
  git(repo, "add", ".codex/pm/tasks/repository-harness/bootstrap.md");
  git(repo, "commit", "-m", "update task");

  const headSha = git(repo, "rev-parse", "HEAD");
  fs.writeFileSync(path.join(repo, ".codex-review-proof"), `branch=issue-42-bootstrap\nhead_sha=${headSha}\nbase_ref=main\ngenerated_at=2026-03-12T00:00:00Z\n`, "utf8");
  fs.writeFileSync(path.join(repo, ".codex-review"), "scope reviewed: hook\nfindings: no findings\nremaining risks: local-only validation\n", "utf8");

  const binDir = path.join(repo, "bin");
  fs.mkdirSync(binDir);
  fs.writeFileSync(path.join(binDir, "gh"), `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "pr" && "$2" == "list" ]]; then
  echo '[]'
  exit 0
fi
if [[ "$1" == "pr" && "$2" == "view" ]]; then
  printf 'Closes #42'
  exit 0
fi
echo "unexpected gh invocation: $*" >&2
exit 1
`, "utf8");
  fs.chmodSync(path.join(binDir, "gh"), 0o755);

  return { repo, binDir };
}

describe("pre-push hook", () => {
  it("blocks missing review proof", () => {
    const { repo, binDir } = prepareRepo();
    fs.rmSync(path.join(repo, ".codex-review-proof"));

    const result = spawnSync(path.join(repo, ".githooks", "pre-push"), [], {
      cwd: repo,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        BYPASS_BRANCH_FRESHNESS_CHECK: "1",
        CLAWPACK_BASE_REF: "main",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("missing .codex-review-proof");
    fs.rmSync(repo, { recursive: true, force: true });
  });

  it("blocks closure sync mismatch when task is not done", () => {
    const { repo, binDir } = prepareRepo();

    const result = spawnSync(path.join(repo, ".githooks", "pre-push"), [], {
      cwd: repo,
      env: {
        ...process.env,
        PATH: `${binDir}:${process.env.PATH}`,
        BYPASS_BRANCH_FRESHNESS_CHECK: "1",
        CLAWPACK_BASE_REF: "main",
      },
      encoding: "utf8",
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("matching task file is not marked done");
    fs.rmSync(repo, { recursive: true, force: true });
  });
});

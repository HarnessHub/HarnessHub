import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { main } from "../scripts/codex-pm.mjs";

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-pm-errors-"));
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function git(cwd: string, ...args: string[]) {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout);
  }
  return result.stdout.trim();
}

describe("codex-pm error paths", () => {
  it("validates required arguments and enum values", () => {
    const errors: string[] = [];
    expect(main(["task-new", "repository-harness", "coverage"], { log: () => undefined, error: (value: string) => errors.push(value) } as Console)).toBe(1);
    expect(main(["blocked", "missing.md"], { log: () => undefined, error: (value: string) => errors.push(value) } as Console)).toBe(1);
    expect(main(["set-status", "missing.md", "nope"], { log: () => undefined, error: (value: string) => errors.push(value) } as Console)).toBe(1);
    expect(errors.join("\n")).toContain("--title is required");
    expect(errors.join("\n")).toContain("--reason is required");
    expect(errors.join("\n")).toContain("status must be one of");
  });

  it("fails pr creation when origin or upstream metadata is unusable", () => {
    git(tmpDir, "init", "-b", "main");
    git(tmpDir, "config", "user.name", "Test User");
    git(tmpDir, "config", "user.email", "test@example.com");
    fs.writeFileSync(path.join(tmpDir, "README.md"), "base\n", "utf8");
    git(tmpDir, "add", "README.md");
    git(tmpDir, "commit", "-m", "base");
    git(tmpDir, "checkout", "-b", "issue-85-coverage");

    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "coverage",
      "--title",
      "Coverage task",
      "--issue",
      "85",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "coverage.md");

    const errors: string[] = [];
    expect(main(["pr-create", taskPath], { log: () => undefined, error: (value: string) => errors.push(value) } as Console)).toBe(1);
    expect(errors.join("\n")).toContain("could not derive the fork owner");

    git(tmpDir, "remote", "add", "origin", "git@github.com:test/HarnessHub.git");
    git(tmpDir, "remote", "add", "upstream", "git@github.com:SomeoneElse/HarnessHub.git");

    const mismatchErrors: string[] = [];
    expect(main(["pr-create", taskPath, "--base-repo", "HarnessHub/HarnessHub"], { log: () => undefined, error: (value: string) => mismatchErrors.push(value) } as Console)).toBe(1);
    expect(mismatchErrors.join("\n")).toContain("upstream remote points to SomeoneElse/HarnessHub");
  });

  it("covers issue-deliver validation failures", () => {
    git(tmpDir, "init", "-b", "main");
    git(tmpDir, "config", "user.name", "Test User");
    git(tmpDir, "config", "user.email", "test@example.com");
    git(tmpDir, "remote", "add", "origin", "git@github.com:test/HarnessHub.git");
    git(tmpDir, "remote", "add", "upstream", "https://github.com/HarnessHub/HarnessHub.git");
    fs.writeFileSync(path.join(tmpDir, "README.md"), "base\n", "utf8");
    git(tmpDir, "add", "README.md");
    git(tmpDir, "commit", "-m", "base");
    git(tmpDir, "checkout", "-b", "issue-85-coverage");

    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "coverage",
      "--title",
      "Coverage task",
      "--issue",
      "85",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "coverage.md");

    const nonDoneErrors: string[] = [];
    expect(main(["issue-deliver", taskPath], { log: () => undefined, error: (value: string) => nonDoneErrors.push(value) } as Console)).toBe(1);
    expect(nonDoneErrors.join("\n")).toContain("requires the task to be status=done");

    expect(main(["set-status", taskPath, "done"])).toBe(0);
    const mismatchErrors: string[] = [];
    expect(main(["issue-deliver", taskPath, "--head-branch", "issue-99-other"], { log: () => undefined, error: (value: string) => mismatchErrors.push(value) } as Console)).toBe(1);
    expect(mismatchErrors.join("\n")).toContain("branch issue-99-other targets issue #99");
  });

  it("rejects issue delivery for non-task and umbrella documents", () => {
    expect(main(["init"])).toBe(0);
    expect(main(["prd-new", "release-quality", "--title", "Release quality"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "coverage-umbrella",
      "--title",
      "Umbrella coverage",
      "--issue",
      "85",
      "--task-type",
      "umbrella",
    ])).toBe(0);
    const prdPath = path.join(tmpDir, ".codex", "pm", "prds", "release-quality.md");
    const umbrellaPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "coverage-umbrella.md");

    const nonTaskErrors: string[] = [];
    expect(main(["issue-deliver", prdPath, "--issue", "85"], { log: () => undefined, error: (value: string) => nonTaskErrors.push(value) } as Console)).toBe(1);
    expect(nonTaskErrors.join("\n")).toContain("requires a task document");

    expect(main(["set-status", umbrellaPath, "done"])).toBe(0);
    const umbrellaErrors: string[] = [];
    expect(main(["issue-deliver", umbrellaPath], { log: () => undefined, error: (value: string) => umbrellaErrors.push(value) } as Console)).toBe(1);
    expect(umbrellaErrors.join("\n")).toContain("does not support task_type=umbrella");
  });

  it("reports closure-sync failures when matching tasks are missing or not done", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "coverage",
      "--title",
      "Coverage task",
      "--issue",
      "85",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "coverage.md");

    const missingTaskErrors: string[] = [];
    expect(main([
      "verify-pr-closure-sync",
      "--pr-body",
      "Closes #99",
      "--changed-file",
      path.relative(tmpDir, taskPath),
    ], { log: () => undefined, error: (value: string) => missingTaskErrors.push(value) } as Console)).toBe(1);
    expect(missingTaskErrors.join("\n")).toContain("does not update the matching local task file");

    const notDoneErrors: string[] = [];
    expect(main([
      "verify-pr-closure-sync",
      "--pr-body",
      "Closes #85",
      "--changed-file",
      path.relative(tmpDir, taskPath),
    ], { log: () => undefined, error: (value: string) => notDoneErrors.push(value) } as Console)).toBe(1);
    expect(notDoneErrors.join("\n")).toContain("matching task file is not marked done");
  });

  it("updates delivery state when an open PR already exists", () => {
    git(tmpDir, "init", "-b", "main");
    git(tmpDir, "config", "user.name", "Test User");
    git(tmpDir, "config", "user.email", "test@example.com");
    git(tmpDir, "remote", "add", "origin", "git@github.com:test/HarnessHub.git");
    git(tmpDir, "remote", "add", "upstream", "https://github.com/HarnessHub/HarnessHub.git");
    fs.writeFileSync(path.join(tmpDir, "README.md"), "base\n", "utf8");
    git(tmpDir, "add", "README.md");
    git(tmpDir, "commit", "-m", "base");
    git(tmpDir, "checkout", "-b", "issue-85-coverage");

    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "coverage",
      "--title",
      "Coverage task",
      "--issue",
      "85",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "coverage.md");
    expect(main(["issue-state-init", taskPath])).toBe(0);
    expect(main(["set-status", taskPath, "done"])).toBe(0);

    const binDir = path.join(tmpDir, "bin");
    fs.mkdirSync(binDir);
    fs.writeFileSync(path.join(binDir, "gh"), `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "pr" && "$2" == "list" ]]; then
  echo '[{"url":"https://github.com/HarnessHub/HarnessHub/pull/999"}]'
  exit 0
fi
echo "unexpected gh invocation: $*" >&2
exit 1
`, "utf8");
    fs.chmodSync(path.join(binDir, "gh"), 0o755);

    const originalPath = process.env.PATH ?? "";
    process.env.PATH = `${binDir}:${originalPath}`;
    try {
      const logs: string[] = [];
      expect(main(["delivery-state-check"], { log: (value: string) => logs.push(value), error: () => undefined } as Console)).toBe(0);
      expect(logs.join("\n")).toContain("already has an open PR");
    } finally {
      process.env.PATH = originalPath;
    }

    const statePath = path.join(tmpDir, ".codex", "pm", "issue-state", "85-coverage.md");
    const stateDocument = fs.readFileSync(statePath, "utf8");
    expect(stateDocument).toContain("delivery_stage: pr_opened");
    expect(stateDocument).toContain("pr_url: https://github.com/HarnessHub/HarnessHub/pull/999");
  });

  it("passes delivery-state check when the issue-state is already pr_opened", () => {
    git(tmpDir, "init", "-b", "main");
    git(tmpDir, "config", "user.name", "Test User");
    git(tmpDir, "config", "user.email", "test@example.com");
    git(tmpDir, "checkout", "-b", "issue-85-coverage");

    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "coverage",
      "--title",
      "Coverage task",
      "--issue",
      "85",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "coverage.md");
    expect(main(["issue-state-init", taskPath])).toBe(0);
    expect(main(["set-status", taskPath, "done"])).toBe(0);

    const statePath = path.join(tmpDir, ".codex", "pm", "issue-state", "85-coverage.md");
    let stateDocument = fs.readFileSync(statePath, "utf8");
    stateDocument = stateDocument.replace("delivery_stage: ready_to_deliver", "delivery_stage: pr_opened\npr_url: https://github.com/HarnessHub/HarnessHub/pull/999");
    fs.writeFileSync(statePath, stateDocument, "utf8");

    const logs: string[] = [];
    expect(main(["delivery-state-check"], { log: (value: string) => logs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(logs.join("\n")).toContain("already at pr_opened");
  });
});

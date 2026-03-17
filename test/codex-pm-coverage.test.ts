import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { docToDict, initIssueState, loadTasks, main, parseArgs, readDocument, renderIssueBody, renderPrBody, verifyClosureSync } from "../scripts/codex-pm.mjs";

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-pm-coverage-"));
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

function makeIssueBranch(name = "issue-85-coverage") {
  git(tmpDir, "init", "-b", "main");
  git(tmpDir, "config", "user.name", "Test User");
  git(tmpDir, "config", "user.email", "test@example.com");
  git(tmpDir, "remote", "add", "origin", "git@github.com:test/HarnessHub.git");
  git(tmpDir, "remote", "add", "upstream", "https://github.com/HarnessHub/HarnessHub.git");
  fs.writeFileSync(path.join(tmpDir, "README.md"), "base\n", "utf8");
  git(tmpDir, "add", "README.md");
  git(tmpDir, "commit", "-m", "base");
  git(tmpDir, "checkout", "-b", name);
}

describe("codex-pm coverage", () => {
  it("creates prd and epic documents and reports unknown actions", () => {
    expect(main(["init"])).toBe(0);
    expect(main(["prd-new", "release-quality", "--title", "Release quality"])).toBe(0);
    expect(main(["epic-new", "repository-harness", "--title", "Repository harness", "--prd", "release-quality"])).toBe(0);

    expect(fs.existsSync(path.join(tmpDir, ".codex", "pm", "prds", "release-quality.md"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".codex", "pm", "epics", "repository-harness.md"))).toBe(true);

    const errors: string[] = [];
    expect(main(["not-a-real-action"], { log: () => undefined, error: (value: string) => errors.push(value) } as Console)).toBe(1);
    expect(errors.join("\n")).toContain("Unknown action");
  });

  it("lists, selects, blocks, and summarizes tasks in text and json modes", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "first",
      "--title",
      "First task",
      "--status",
      "backlog",
      "--issue",
      "85",
      "--labels",
      "coverage",
    ])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "second",
      "--title",
      "Second task",
      "--status",
      "done",
      "--task-type",
      "docs",
    ])).toBe(0);

    const firstTask = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "first.md");
    expect(main(["blocked", firstTask, "--reason", "waiting on coverage plan"])).toBe(0);

    const listLogs: string[] = [];
    expect(main(["tasks", "--epic", "repository-harness"], { log: (value: string) => listLogs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(listLogs.join("\n")).toContain("status=blocked issue=85");

    const nextLogs: string[] = [];
    expect(main(["next"], { log: (value: string) => nextLogs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(nextLogs[0]).toContain("No backlog task found.");

    expect(main(["set-status", firstTask, "backlog"])).toBe(0);
    const nextJson: string[] = [];
    expect(main(["next", "--json"], { log: (value: string) => nextJson.push(value), error: () => undefined } as Console)).toBe(0);
    expect(nextJson.join("\n")).toContain("\"title\": \"First task\"");

    const standupLogs: string[] = [];
    expect(main(["standup"], { log: (value: string) => standupLogs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(standupLogs.join("\n")).toContain("backlog: 1");
    expect(standupLogs.join("\n")).toContain("done: 1");

    const standupJson: string[] = [];
    expect(main(["standup", "--json"], { log: (value: string) => standupJson.push(value), error: () => undefined } as Console)).toBe(0);
    expect(standupJson.join("\n")).toContain("\"blocked\": []");
  });

  it("shows issue state documents and reports when they are missing", () => {
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
    const missingErrors: string[] = [];
    expect(main(["issue-state-show", taskPath], { log: () => undefined, error: (value: string) => missingErrors.push(value) } as Console)).toBe(1);
    expect(missingErrors.join("\n")).toContain("No issue state document found");

    expect(main(["issue-state-init", taskPath])).toBe(0);
    const showLogs: string[] = [];
    expect(main(["issue-state-show", taskPath], { log: (value: string) => showLogs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(showLogs.join("\n")).toContain("type: issue_state");
    expect(showLogs.join("\n")).toContain("issue: 85");
  });

  it("covers issue-state and delivery-state checks across skipped, failing, and allowed paths", () => {
    makeIssueBranch("issue-85-coverage");
    expect(main(["init"])).toBe(0);

    const logs: string[] = [];
    expect(main(["issue-state-check", "--branch", "main"], { log: (value: string) => logs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(logs.join("\n")).toContain("not issue-scoped");

    const errors: string[] = [];
    expect(main(["issue-state-check"], { log: () => undefined, error: (value: string) => errors.push(value) } as Console)).toBe(1);
    expect(errors.join("\n")).toContain("no task twin found for issue #85");

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
    expect(main(["set-status", taskPath, "in_progress"])).toBe(0);

    const missingStateErrors: string[] = [];
    expect(main(["issue-state-check"], { log: () => undefined, error: (value: string) => missingStateErrors.push(value) } as Console)).toBe(1);
    expect(missingStateErrors.join("\n")).toContain("has no state document");

    expect(main(["issue-state-init", taskPath])).toBe(0);
    expect(main(["set-status", taskPath, "done"])).toBe(0);

    const allowedLogs: string[] = [];
    expect(main(["delivery-state-check", "--allow-ready-to-deliver"], { log: (value: string) => allowedLogs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(allowedLogs.join("\n")).toContain("ready_to_deliver");
  });

  it("covers reconcile, closure-sync failures, and PR body rendering branches", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "coverage",
      "--title",
      "Coverage task",
      "--issue",
      "85",
      "--task-type",
      "umbrella",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "coverage.md");
    expect(main(["issue-state-init", taskPath])).toBe(0);

    const statePath = path.join(tmpDir, ".codex", "pm", "issue-state", "85-coverage.md");
    let stateText = fs.readFileSync(statePath, "utf8");
    stateText = stateText.replace("status: backlog", "status: blocked");
    stateText = stateText.replace("delivery_stage: backlog", "delivery_stage: blocked");
    fs.writeFileSync(statePath, stateText, "utf8");

    const reconcileLogs: string[] = [];
    expect(main(["issue-state-reconcile"], { log: (value: string) => reconcileLogs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(reconcileLogs.join("\n")).toContain("85-coverage.md");

    const prBody = renderPrBody({
      path: taskPath,
      metadata: { issue: "85", title: "Coverage task", task_type: "umbrella" },
      sections: {
        Deliverable: "Raise overall branch coverage.",
        Validation: "- npm run test:coverage",
        "Implementation Notes": "Focus on high-leverage modules.",
      },
    } as any, { tests: ["npm test"] });
    expect(prBody).not.toContain("Closes #85");
    expect(prBody).toContain("Implementation notes:");
    expect(prBody).toContain("- `npm test`");

    const issueBody = renderIssueBody({
      path: taskPath,
      metadata: { task_type: "implementation", labels: "coverage,quality" },
      sections: {
        Context: "Need more branch coverage.",
        Deliverable: "Reach eighty percent.",
        Scope: "- add tests",
        "Acceptance Criteria": "- coverage >= 80%",
      },
    } as any);
    expect(issueBody).toContain("## Labels");
    expect(issueBody).toContain("coverage,quality");

    const syncErrors = verifyClosureSync("Closes #85", [path.relative(tmpDir, taskPath)]);
    expect(syncErrors.some((error) => error.includes("task_type=umbrella"))).toBe(true);
  });

  it("hydrates task content from a GitHub issue body", () => {
    expect(main(["init"])).toBe(0);
    const binDir = path.join(tmpDir, "bin");
    fs.mkdirSync(binDir);
    fs.writeFileSync(path.join(binDir, "gh"), `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "issue" && "$2" == "view" ]]; then
  printf '%s\n' '{"body":"## Summary\\n\\nRaise branch coverage.\\n\\n## Why\\n\\nCoverage should reflect real behavior.\\n\\n## Scope\\n\\n- add codex-pm tests\\n- add verifier tests\\n\\n## Acceptance Criteria\\n\\n- coverage passes\\n- tests stay maintainable\\n"}'
  exit 0
fi
echo "unexpected gh invocation: $*" >&2
exit 1
`, "utf8");
    fs.chmodSync(path.join(binDir, "gh"), 0o755);

    const originalPath = process.env.PATH ?? "";
    process.env.PATH = `${binDir}:${originalPath}`;
    try {
      expect(main([
        "task-new",
        "repository-harness",
        "hydrated",
        "--title",
        "Hydrated task",
        "--issue",
        "85",
        "--repo",
        "HarnessHub/HarnessHub",
      ])).toBe(0);
    } finally {
      process.env.PATH = originalPath;
    }

    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "hydrated.md");
    const document = fs.readFileSync(taskPath, "utf8");
    expect(document).toContain("Raise branch coverage.");
    expect(document).toContain("Coverage should reflect real behavior.");
    expect(document).toContain("- add codex-pm tests");
    expect(document).toContain("- coverage passes");
  });

  it("marks local task and issue-state done when reconcile sees a closed GitHub issue", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "remote-closed",
      "--title",
      "Remote closed task",
      "--issue",
      "85",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "remote-closed.md");
    expect(main(["issue-state-init", taskPath])).toBe(0);
    expect(main(["set-status", taskPath, "in_progress"])).toBe(0);

    const binDir = path.join(tmpDir, "bin");
    fs.mkdirSync(binDir);
    fs.writeFileSync(path.join(binDir, "gh"), `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "issue" && "$2" == "view" ]]; then
  echo '{"state":"CLOSED"}'
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
      expect(main(["issue-state-reconcile", "--repo", "HarnessHub/HarnessHub"], { log: (value: string) => logs.push(value), error: () => undefined } as Console)).toBe(0);
      expect(logs.join("\n")).toContain("remote-closed.md");
    } finally {
      process.env.PATH = originalPath;
    }

    const taskDocument = fs.readFileSync(taskPath, "utf8");
    const stateDocument = fs.readFileSync(path.join(tmpDir, ".codex", "pm", "issue-state", "85-remote-closed.md"), "utf8");
    expect(taskDocument).toContain("status: done");
    expect(stateDocument).toContain("status: done");
    expect(stateDocument).toContain("delivery_stage: ready_to_deliver");
  });

  it("reports no drift when reconcile finds everything aligned", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "aligned",
      "--title",
      "Aligned task",
      "--issue",
      "85",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "aligned.md");
    expect(main(["issue-state-init", taskPath])).toBe(0);

    const logs: string[] = [];
    expect(main(["issue-state-reconcile"], { log: (value: string) => logs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(logs.join("\n")).toContain("Issue-state reconcile found no drift.");
  });

  it("validates closure sync from event payloads and git diff SHAs", () => {
    git(tmpDir, "init", "-b", "main");
    git(tmpDir, "config", "user.name", "Test User");
    git(tmpDir, "config", "user.email", "test@example.com");
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "diff-driven",
      "--title",
      "Diff driven task",
      "--issue",
      "85",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "diff-driven.md");
    expect(main(["issue-state-init", taskPath])).toBe(0);
    expect(main(["set-status", taskPath, "done"])).toBe(0);

    git(tmpDir, "add", ".codex");
    git(tmpDir, "commit", "-m", "task done");
    const baseSha = git(tmpDir, "rev-parse", "HEAD");

    const taskText = fs.readFileSync(taskPath, "utf8").replace("## Implementation Notes\n", "## Implementation Notes\n\nTouched in follow-up.\n");
    fs.writeFileSync(taskPath, taskText, "utf8");
    git(tmpDir, "add", taskPath);
    git(tmpDir, "commit", "-m", "touch task");
    const headSha = git(tmpDir, "rev-parse", "HEAD");

    const eventPath = path.join(tmpDir, "event.json");
    fs.writeFileSync(eventPath, JSON.stringify({
      pull_request: {
        body: "Closes #85",
      },
    }), "utf8");

    const logs: string[] = [];
    expect(main([
      "verify-pr-closure-sync",
      "--event-path",
      eventPath,
      "--base-sha",
      baseSha,
      "--head-sha",
      headSha,
    ], { log: (value: string) => logs.push(value), error: () => undefined } as Console)).toBe(0);
    expect(logs.join("\n")).toContain("PR task closure sync passed.");
  });

  it("covers exported helper utilities directly", () => {
    expect(parseArgs(["task-path", "--tests", "npm test", "--tests", "npm run build", "--json"])).toEqual({
      positional: ["task-path"],
      options: {
        tests: ["npm test", "npm run build"],
        json: true,
      },
    });

    const doc = {
      path: ".codex/pm/tasks/repository-harness/helper.md",
      metadata: {
        title: "Helper task",
        status: "in_progress",
        labels: "coverage, quality",
      },
      sections: {},
    } as any;
    expect(docToDict(doc)).toMatchObject({
      title: "Helper task",
      status: "in_progress",
      labels: ["coverage", "quality"],
      task_type: "implementation",
    });
  });

  it("reads, sorts, and reuses existing issue-state documents", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "b-task",
      "--title",
      "B task",
      "--status",
      "done",
      "--issue",
      "90",
    ])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "a-task",
      "--title",
      "A task",
      "--status",
      "backlog",
      "--issue",
      "89",
    ])).toBe(0);

    const aTaskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "a-task.md");
    const bTaskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "b-task.md");

    const sortedTasks = loadTasks({});
    expect(sortedTasks.map((task) => task.metadata.title)).toEqual(["A task", "B task"]);

    const firstState = initIssueState(readDocument(aTaskPath));
    const secondState = initIssueState(readDocument(aTaskPath));
    expect(secondState.path).toBe(firstState.path);
    expect(fs.existsSync(firstState.path)).toBe(true);

    expect(() => readDocument(path.join(tmpDir, "not-a-doc.md"))).toThrow();
    fs.writeFileSync(path.join(tmpDir, "not-a-doc.md"), "plain text", "utf8");
    expect(() => readDocument(path.join(tmpDir, "not-a-doc.md"))).toThrow(/document missing frontmatter/);

    expect(loadTasks({ status: "done", epic: "repository-harness" }).map((task) => task.path)).toEqual([
      ".codex/pm/tasks/repository-harness/b-task.md",
    ]);
  });
});

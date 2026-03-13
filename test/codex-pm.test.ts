import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { main } from "../scripts/codex-pm.mjs";

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-pm-"));
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("codex-pm", () => {
  it("initializes the pm workspace", () => {
    expect(main(["init"])).toBe(0);
    expect(fs.existsSync(path.join(tmpDir, ".codex", "pm", "tasks"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".codex", "pm", "issue-state"))).toBe(true);
  });

  it("scaffolds tasks and renders issue and pr bodies", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "bootstrap",
      "--title",
      "Bootstrap harness",
      "--issue",
      "42",
      "--labels",
      "feature,test",
    ])).toBe(0);

    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "bootstrap.md");
    let text = fs.readFileSync(taskPath, "utf8");
    text = text.replace("## Context\n\n", "## Context\n\nNeed a local PM workflow.\n\n");
    text = text.replace("## Deliverable\n\n", "## Deliverable\n\nAdd local PM scripts.\n\n");
    text = text.replace("## Validation\n\n- \n\n", "## Validation\n\n- npm test\n\n");
    fs.writeFileSync(taskPath, text, "utf8");

    const issueLog: string[] = [];
    const prLog: string[] = [];
    expect(main(["issue-body", taskPath], { log: (value: string) => issueLog.push(value), error: () => undefined } as Console)).toBe(0);
    expect(issueLog.join("\n")).toContain("Need a local PM workflow.");

    expect(main(["pr-body", taskPath, "--issue", "42", "--tests", "npm test"], { log: (value: string) => prLog.push(value), error: () => undefined } as Console)).toBe(0);
    expect(prLog.join("\n")).toContain("Closes #42");
    expect(prLog.join("\n")).toContain("Validation:");
  });

  it("creates issue state and verifies closure sync", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "bootstrap",
      "--title",
      "Bootstrap harness",
      "--issue",
      "42",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "bootstrap.md");

    expect(main(["issue-state-init", taskPath])).toBe(0);
    const statePath = path.join(tmpDir, ".codex", "pm", "issue-state", "42-bootstrap.md");
    expect(fs.existsSync(statePath)).toBe(true);

    expect(main(["set-status", taskPath, "done"])).toBe(0);
    expect(main([
      "verify-pr-closure-sync",
      "--pr-body",
      "Closes #42",
      "--changed-file",
      path.relative(tmpDir, taskPath),
    ])).toBe(0);
  });

  it("syncs linked issue-state status when task status changes", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "bootstrap",
      "--title",
      "Bootstrap harness",
      "--issue",
      "42",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "bootstrap.md");

    expect(main(["issue-state-init", taskPath])).toBe(0);
    expect(main(["set-status", taskPath, "in_progress"])).toBe(0);
    expect(main(["set-status", taskPath, "done"])).toBe(0);

    const statePath = path.join(tmpDir, ".codex", "pm", "issue-state", "42-bootstrap.md");
    const stateDocument = fs.readFileSync(statePath, "utf8");
    expect(stateDocument).toContain("status: done");
  });

  it("fails issue-state check and closure sync when linked issue-state status drifts", () => {
    expect(main(["init"])).toBe(0);
    expect(main([
      "task-new",
      "repository-harness",
      "bootstrap",
      "--title",
      "Bootstrap harness",
      "--issue",
      "42",
    ])).toBe(0);
    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "bootstrap.md");

    expect(main(["issue-state-init", taskPath])).toBe(0);
    expect(main(["set-status", taskPath, "in_progress"])).toBe(0);

    const statePath = path.join(tmpDir, ".codex", "pm", "issue-state", "42-bootstrap.md");
    const driftedState = fs.readFileSync(statePath, "utf8").replace("status: in_progress", "status: backlog");
    fs.writeFileSync(statePath, driftedState, "utf8");

    const errors: string[] = [];
    expect(main(["issue-state-check", "--branch", "issue-42-bootstrap"], {
      log: () => undefined,
      error: (value: string) => errors.push(value),
    } as Console)).toBe(1);
    expect(errors.join("\n")).toContain("task and issue-state status differ");

    expect(main(["set-status", taskPath, "done"])).toBe(0);
    const redriftedState = fs.readFileSync(statePath, "utf8").replace("status: done", "status: backlog");
    fs.writeFileSync(statePath, redriftedState, "utf8");

    const closureErrors: string[] = [];
    expect(main([
      "verify-pr-closure-sync",
      "--pr-body",
      "Closes #42",
      "--changed-file",
      path.relative(tmpDir, taskPath),
    ], {
      log: () => undefined,
      error: (value: string) => closureErrors.push(value),
    } as Console)).toBe(1);
    expect(closureErrors.join("\n")).toContain("linked issue-state status does not match task status");
  });

  it("hydrates task twins and issue state from issue intent", () => {
    expect(main(["init"])).toBe(0);
    const issueBodyPath = path.join(tmpDir, "issue-body.md");
    fs.writeFileSync(issueBodyPath, [
      "## Summary",
      "Improve local PM twin hydration so startup requires less copy-editing.",
      "",
      "## Why",
      "The local twin structure exists, but initial files are too empty to guide implementation.",
      "",
      "## Scope",
      "- hydrate Context from issue intent",
      "- hydrate Scope and Acceptance Criteria",
      "",
      "## Acceptance Criteria",
      "- task twins start useful",
      "- issue-state next steps reflect scope",
      "",
    ].join("\n"), "utf8");

    expect(main([
      "task-new",
      "repository-harness",
      "pm-hydration",
      "--title",
      "Improve local PM twin hydration",
      "--issue",
      "32",
      "--issue-body-file",
      issueBodyPath,
    ])).toBe(0);

    const taskPath = path.join(tmpDir, ".codex", "pm", "tasks", "repository-harness", "pm-hydration.md");
    const taskText = fs.readFileSync(taskPath, "utf8");
    expect(taskText).toContain("Improve local PM twin hydration so startup requires less copy-editing.");
    expect(taskText).toContain("The local twin structure exists, but initial files are too empty to guide implementation.");
    expect(taskText).toContain("- hydrate Scope and Acceptance Criteria");

    expect(main(["set-status", taskPath, "in_progress"])).toBe(0);
    expect(main(["issue-state-init", taskPath])).toBe(0);

    const statePath = path.join(tmpDir, ".codex", "pm", "issue-state", "32-pm-hydration.md");
    const stateText = fs.readFileSync(statePath, "utf8");
    expect(stateText).toContain("Improve local PM twin hydration so startup requires less copy-editing.");
    expect(stateText).toContain("- hydrate Context from issue intent");
    expect(stateText).toContain("- task twins start useful");
    expect(stateText).toContain("status: in_progress");
  });
});

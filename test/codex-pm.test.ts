import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { main } from "../scripts/codex-pm.mjs";

let tmpDir: string;
let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "clawpack-pm-"));
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
});

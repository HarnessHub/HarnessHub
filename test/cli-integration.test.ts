import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = path.join(repoRoot, "dist", "cli.js");

function runCli(args: string[], cwd = repoRoot) {
  return spawnSync("node", [cliPath, ...args], {
    cwd,
    encoding: "utf8",
  });
}

function createTemplateSource(dir: string) {
  fs.mkdirSync(path.join(dir, "workspace", "skills", "demo"), { recursive: true });
  fs.writeFileSync(path.join(dir, "openclaw.json"), JSON.stringify({
    identity: { name: "Demo" },
  }, null, 2));
  fs.writeFileSync(path.join(dir, "workspace", "AGENTS.md"), "# Agent\n");
  fs.writeFileSync(path.join(dir, "workspace", "SOUL.md"), "# Soul\n");
  fs.writeFileSync(path.join(dir, "workspace", "skills", "demo", "SKILL.md"), "---\nname: demo\ndescription: demo\n---\nDemo skill.\n");
}

function createInstanceSource(dir: string) {
  createTemplateSource(dir);
  fs.mkdirSync(path.join(dir, "agents", "main", "agent"), { recursive: true });
  fs.mkdirSync(path.join(dir, "agents", "main", "sessions"), { recursive: true });
  fs.mkdirSync(path.join(dir, "credentials"), { recursive: true });
  fs.writeFileSync(path.join(dir, "agents", "main", "agent", "auth-profiles.json"), JSON.stringify({
    version: 1,
    profiles: {
      "anthropic:default": {
        type: "api_key",
        credentials: { apiKey: "sk-ant-fake" },
      },
    },
  }, null, 2));
  fs.writeFileSync(path.join(dir, "agents", "main", "sessions", "abc123.jsonl"), "{\"role\":\"user\",\"content\":\"hi\"}\n");
  fs.writeFileSync(path.join(dir, "credentials", "oauth.json"), "{\"token\":\"fake\"}\n");
}

let tmpDir: string;

beforeAll(() => {
  const build = spawnSync("npm", ["run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  if (build.status !== 0) {
    throw new Error(build.stderr || build.stdout || "build failed");
  }
});

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-cli-integration-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("harness CLI integration", () => {
  it("inspects a valid instance through the CLI", () => {
    const sourceDir = path.join(tmpDir, "source");
    createTemplateSource(sourceDir);

    const result = runCli(["inspect", "-p", sourceDir, "-f", "json"]);
    expect(result.status).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.detected).toBe(true);
    expect(data.recommendedPackType).toBe("template");
    expect(data.workflow.recommendedExportCommand).toContain("harness export");
    expect(data.workflow.recommendationSummary).toContain("template export");
  });

  it("returns instance-oriented workflow guidance when inspect recommends instance", () => {
    const sourceDir = path.join(tmpDir, "source");
    createInstanceSource(sourceDir);

    const result = runCli(["inspect", "-p", sourceDir, "-f", "json"]);
    expect(result.status).toBe(0);
    const data = JSON.parse(result.stdout);
    expect(data.recommendedPackType).toBe("instance");
    expect(data.workflow.recommendedExportCommand).toContain("-t instance");
    expect(data.workflow.overrideExportCommand).toContain("--allow-pack-type-override");
  });

  it("rejects an invalid export type with a JSON error", () => {
    const sourceDir = path.join(tmpDir, "source");
    createTemplateSource(sourceDir);

    const result = runCli(["export", "-p", sourceDir, "-t", "bad-type", "-f", "json"]);
    expect(result.status).toBe(1);
    const data = JSON.parse(result.stdout);
    expect(data.error).toContain("Invalid pack type");
  });

  it("runs a full template roundtrip through CLI commands", () => {
    const sourceDir = path.join(tmpDir, "source");
    const targetDir = path.join(tmpDir, "target");
    const packFile = path.join(tmpDir, "template.harness");
    createTemplateSource(sourceDir);

    expect(runCli(["export", "-p", sourceDir, "-o", packFile, "-t", "template", "-f", "json"]).status).toBe(0);
    expect(runCli(["import", packFile, "-t", targetDir, "-f", "json"]).status).toBe(0);

    const verifyResult = runCli(["verify", "-p", targetDir, "-f", "json"]);
    expect(verifyResult.status).toBe(0);
    const data = JSON.parse(verifyResult.stdout);
    expect(data.valid).toBe(true);
    expect(data.runtimeReady).toBe(true);
    expect(data.readinessClass).toBe("runtime_ready");
    expect(data.checks.some((check: { name: string; passed: boolean }) => check.name === "manifest_schema" && check.passed)).toBe(true);
  });

  it("requires explicit override when exporting template against an instance recommendation", () => {
    const sourceDir = path.join(tmpDir, "source");
    const packFile = path.join(tmpDir, "template.harness");
    createInstanceSource(sourceDir);

    const blocked = runCli(["export", "-p", sourceDir, "-o", packFile, "-t", "template", "-f", "json"]);
    expect(blocked.status).toBe(1);
    expect(JSON.parse(blocked.stdout).error).toContain("explicit pack-type override");

    const allowed = runCli(["export", "-p", sourceDir, "-o", packFile, "-t", "template", "--allow-pack-type-override", "-f", "json"]);
    expect(allowed.status).toBe(0);
    const data = JSON.parse(allowed.stdout);
    expect(data.policyWarnings.some((warning: string) => warning.includes("Inspect recommended instance"))).toBe(true);
  });

  it("runs an instance roundtrip and preserves sensitive structure", () => {
    const sourceDir = path.join(tmpDir, "source");
    const targetDir = path.join(tmpDir, "target");
    const packFile = path.join(tmpDir, "instance.harness");
    createInstanceSource(sourceDir);

    expect(runCli(["export", "-p", sourceDir, "-o", packFile, "-t", "instance", "-f", "json"]).status).toBe(0);
    expect(runCli(["import", packFile, "-t", targetDir, "-f", "json"]).status).toBe(0);
    expect(fs.existsSync(path.join(targetDir, "agents", "main", "agent", "auth-profiles.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, ".harness-manifest.json"))).toBe(true);

    const verifyResult = runCli(["verify", "-p", targetDir, "-f", "json"]);
    expect(verifyResult.status).toBe(0);
    const data = JSON.parse(verifyResult.stdout);
    expect(data.valid).toBe(true);
    expect(data.runtimeReady).toBe(true);
    expect(data.readinessClass).toBe("runtime_ready");
  });

  it("returns a JSON error when importing a missing pack file", () => {
    const result = runCli(["import", path.join(tmpDir, "missing.harness"), "-f", "json"]);
    expect(result.status).toBe(1);
    const data = JSON.parse(result.stdout);
    expect(data.error).toContain("Pack file not found");
  });

  it("executes correctly through a symlinked CLI path", () => {
    const symlinkPath = path.join(tmpDir, "harness");
    fs.symlinkSync(cliPath, symlinkPath);

    const result = spawnSync("node", [symlinkPath, "--version"], {
      cwd: repoRoot,
      encoding: "utf8",
    });

    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe("0.1.0");
  });

  it("returns a failing verify result for a missing target path", () => {
    const result = runCli(["verify", "-p", path.join(tmpDir, "missing-target"), "-f", "json"]);
    expect(result.status).toBe(1);
    const data = JSON.parse(result.stdout);
    expect(data.valid).toBe(false);
    expect(data.runtimeReady).toBe(false);
    expect(data.readinessClass).toBe("structurally_invalid");
    expect(data.errors).toContain("Target directory does not exist");
    expect(data.remediationSteps).toContain("Import the .harness package into the target directory before running verify.");
  });
});

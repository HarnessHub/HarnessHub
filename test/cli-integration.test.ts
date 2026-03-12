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
    expect(data.checks.some((check: { name: string; passed: boolean }) => check.name === "manifest_schema" && check.passed)).toBe(true);
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
  });

  it("returns a JSON error when importing a missing pack file", () => {
    const result = runCli(["import", path.join(tmpDir, "missing.harness"), "-f", "json"]);
    expect(result.status).toBe(1);
    const data = JSON.parse(result.stdout);
    expect(data.error).toContain("Pack file not found");
  });

  it("returns a failing verify result for a missing target path", () => {
    const result = runCli(["verify", "-p", path.join(tmpDir, "missing-target"), "-f", "json"]);
    expect(result.status).toBe(1);
    const data = JSON.parse(result.stdout);
    expect(data.valid).toBe(false);
    expect(data.errors).toContain("Target directory does not exist");
  });
});

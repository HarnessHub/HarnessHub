import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { inspect } from "../src/core/scanner.js";
import { exportPack, importPack } from "../src/core/packer.js";
import { verify } from "../src/core/verifier.js";

/** Create a minimal OpenClaw instance with actual directory structure */
function createMockInstance(dir: string) {
  fs.mkdirSync(dir, { recursive: true });

  // Config file
  fs.writeFileSync(
    path.join(dir, "openclaw.json"),
    JSON.stringify({
      identity: { name: "TestBot", emoji: "\u{1F99E}" },
      gateway: { port: 18789 },
    }, null, 2)
  );

  // Workspace
  const wsDir = path.join(dir, "workspace");
  fs.mkdirSync(wsDir, { recursive: true });
  fs.writeFileSync(path.join(wsDir, "AGENTS.md"), "# Test Agent\nYou are a helpful assistant.");
  fs.writeFileSync(path.join(wsDir, "SOUL.md"), "# Soul\nFriendly and helpful.");
  fs.writeFileSync(path.join(wsDir, "TOOLS.md"), "# Tools\n- search\n- browse");

  // Skills in workspace
  const skillDir = path.join(wsDir, "skills", "greeting");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "---\nname: greeting\ndescription: Greet the user\n---\nSay hello!"
  );

  return dir;
}

/** Create a full instance with agents, sessions, credentials (actual OpenClaw structure) */
function createMockInstanceWithSensitiveData(dir: string) {
  createMockInstance(dir);

  // Agent directory: agents/main/agent/
  const agentDir = path.join(dir, "agents", "main", "agent");
  fs.mkdirSync(agentDir, { recursive: true });
  fs.writeFileSync(
    path.join(agentDir, "auth-profiles.json"),
    JSON.stringify({
      version: 1,
      profiles: { "anthropic:default": { type: "api_key", credentials: { apiKey: "sk-ant-fake" } } },
      order: { main: ["default"] },
    }, null, 2)
  );
  fs.writeFileSync(
    path.join(agentDir, "models.json"),
    JSON.stringify({ models: [] }, null, 2)
  );

  // Sessions: agents/main/sessions/*.jsonl
  const sessionsDir = path.join(dir, "agents", "main", "sessions");
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.writeFileSync(
    path.join(sessionsDir, "sessions.json"),
    JSON.stringify({ "default": { sessionId: "abc123", file: "abc123.jsonl" } })
  );
  fs.writeFileSync(
    path.join(sessionsDir, "abc123.jsonl"),
    '{"role":"user","content":"hello"}\n{"role":"assistant","content":"hi"}\n'
  );

  // Credentials directory
  const credDir = path.join(dir, "credentials");
  fs.mkdirSync(credDir, { recursive: true });
  fs.writeFileSync(
    path.join(credDir, "oauth.json"),
    '{ "token": "fake-oauth-token" }'
  );

  // WhatsApp creds
  const waDir = path.join(credDir, "whatsapp", "default");
  fs.mkdirSync(waDir, { recursive: true });
  fs.writeFileSync(
    path.join(waDir, "creds.json"),
    '{ "session": "fake-wa-session" }'
  );

  // GitHub Copilot token
  fs.writeFileSync(
    path.join(credDir, "github-copilot.token.json"),
    '{ "token": "ghu_fake", "expires_at": 9999999999 }'
  );

  // Memory database
  const memDir = path.join(dir, "memory");
  fs.mkdirSync(memDir, { recursive: true });
  fs.writeFileSync(path.join(memDir, "main.sqlite"), "fake-sqlite-data");

  // Cron
  const cronDir = path.join(dir, "cron");
  fs.mkdirSync(cronDir, { recursive: true });
  fs.writeFileSync(
    path.join(cronDir, "jobs.json"),
    JSON.stringify({ "morning-report": { schedule: "0 9 * * *" } })
  );
  const runsDir = path.join(cronDir, "runs");
  fs.mkdirSync(runsDir, { recursive: true });
  fs.writeFileSync(
    path.join(runsDir, "morning-report.jsonl"),
    '{"ts":"2026-01-01T09:00:00Z","status":"ok"}\n'
  );

  // .env
  fs.writeFileSync(path.join(dir, ".env"), "ANTHROPIC_API_KEY=sk-fake\n");

  return dir;
}

function createMockInstanceWithCustomWorkspaces(dir: string) {
  fs.mkdirSync(dir, { recursive: true });

  const defaultWorkspace = path.join(path.dirname(dir), "workspace-main-external");
  const workWorkspace = path.join(path.dirname(dir), "workspace-work-external");

  fs.mkdirSync(defaultWorkspace, { recursive: true });
  fs.mkdirSync(workWorkspace, { recursive: true });

  fs.writeFileSync(path.join(defaultWorkspace, "AGENTS.md"), "# Main Agent\nCustom workspace.");
  fs.writeFileSync(path.join(defaultWorkspace, "SOUL.md"), "# Main Soul\nCustom workspace.");
  fs.writeFileSync(path.join(workWorkspace, "AGENTS.md"), "# Work Agent\nSecondary workspace.");
  fs.writeFileSync(path.join(workWorkspace, "TOOLS.md"), "# Work Tools\n- verify");

  fs.writeFileSync(
    path.join(dir, "openclaw.json"),
    JSON.stringify({
      agents: {
        defaults: { workspace: defaultWorkspace },
        list: [
          { id: "main", default: true, workspace: defaultWorkspace },
          { id: "work", workspace: workWorkspace },
        ],
      },
    }, null, 2)
  );

  return { dir, defaultWorkspace, workWorkspace };
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("inspect", () => {
  it("detects a valid OpenClaw instance", () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "instance"));
    const result = inspect(instanceDir);

    expect(result.detected).toBe(true);
    expect(result.product).toBe("openclaw");
    expect(result.structure.hasConfig).toBe(true);
    expect(result.structure.hasWorkspace).toBe(true);
    expect(result.structure.workspaceFiles).toContain("workspace/AGENTS.md");
    expect(result.structure.workspaceFiles).toContain("workspace/SOUL.md");
  });

  it("detects config-defined external workspaces", () => {
    const { dir } = createMockInstanceWithCustomWorkspaces(path.join(tmpDir, "external"));
    const result = inspect(dir);

    expect(result.detected).toBe(true);
    expect(result.structure.workspaceDirs).toEqual(["workspace", "workspace-work"]);
    expect(result.structure.workspaceFiles).toContain("workspace/AGENTS.md");
    expect(result.structure.workspaceFiles).toContain("workspace-work/AGENTS.md");
  });

  it("reports non-existent directory", () => {
    const result = inspect(path.join(tmpDir, "nonexistent"));
    expect(result.detected).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("detects sensitive content with actual OpenClaw structure", () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "sensitive"));
    const result = inspect(instanceDir);

    expect(result.detected).toBe(true);
    expect(result.sensitiveFlags.hasCredentials).toBe(true);
    expect(result.sensitiveFlags.hasOAuthTokens).toBe(true);
    expect(result.sensitiveFlags.hasAuthProfiles).toBe(true);
    expect(result.sensitiveFlags.hasWhatsAppCreds).toBe(true);
    expect(result.sensitiveFlags.hasCopilotToken).toBe(true);
    expect(result.sensitiveFlags.hasSessions).toBe(true);
    expect(result.sensitiveFlags.hasMemoryDb).toBe(true);
    expect(result.sensitiveFlags.hasEnvFile).toBe(true);
    expect(result.recommendedPackType).toBe("instance");
    expect(result.riskAssessment).toBe("trusted-migration-only");
  });

  it("detects agent directories", () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "agents"));
    const result = inspect(instanceDir);

    expect(result.structure.hasAgents).toBe(true);
    expect(result.structure.agentIds).toContain("main");
  });

  it("detects sessions in agents/*/sessions/*.jsonl", () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "sessions"));
    const result = inspect(instanceDir);

    expect(result.structure.hasSessions).toBe(true);
    expect(result.structure.sessionFiles.some(f => f.endsWith(".jsonl"))).toBe(true);
  });

  it("detects cron jobs", () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "cron"));
    const result = inspect(instanceDir);

    expect(result.structure.hasCron).toBe(true);
    expect(result.structure.cronJobs.length).toBeGreaterThan(0);
  });

  it("recommends template for clean instances", () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "clean"));
    const result = inspect(instanceDir);

    expect(result.recommendedPackType).toBe("template");
    expect(result.riskAssessment).toBe("safe-share");
  });
});

describe("export + import", () => {
  it("exports a template pack", async () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "instance"));
    const outputFile = path.join(tmpDir, "test.harness");

    const result = await exportPack({
      sourcePath: instanceDir,
      outputPath: outputFile,
      packType: "template",
    });

    expect(result.outputFile).toBe(outputFile);
    expect(result.manifest.packType).toBe("template");
    expect(result.manifest.riskLevel).toBe("safe-share");
    expect(result.manifest.image.imageId).toBe(result.manifest.packId);
    expect(result.manifest.image.adapter).toBe("openclaw");
    expect(result.manifest.lineage.parentImage).toBeNull();
    expect(result.manifest.lineage.layerOrder).toEqual([]);
    expect(result.manifest.harness.intent).toBe("agent-runtime-environment");
    expect(result.manifest.harness.targetProduct).toBe("openclaw");
    expect(result.manifest.harness.components).toEqual(["workspace", "config", "skills"]);
    expect(result.fileCount).toBeGreaterThan(0);
    expect(fs.existsSync(outputFile)).toBe(true);
  });

  it("exports an instance pack with sensitive data", async () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "sensitive"));
    const outputFile = path.join(tmpDir, "instance.harness");

    const result = await exportPack({
      sourcePath: instanceDir,
      outputPath: outputFile,
      packType: "instance",
    });

    expect(result.manifest.packType).toBe("instance");
    expect(result.manifest.riskLevel).toBe("trusted-migration-only");
    expect(result.manifest.image.imageId).toBe(result.manifest.packId);
    expect(result.manifest.image.adapter).toBe("openclaw");
    expect(result.manifest.harness.components).toEqual([
      "workspace",
      "config",
      "skills",
      "agents",
      "credentials",
      "sessions",
      "memory",
      "cron",
    ]);
    expect(fs.existsSync(outputFile)).toBe(true);
  });

  it("template pack excludes all sensitive files", async () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "sensitive"));
    const outputFile = path.join(tmpDir, "template.harness");

    const result = await exportPack({
      sourcePath: instanceDir,
      outputPath: outputFile,
      packType: "template",
    });

    const paths = result.manifest.includedPaths;
    // Must not include credentials
    expect(paths.some(p => p.includes("credentials"))).toBe(false);
    // Must not include auth-profiles.json
    expect(paths.some(p => p.includes("auth-profiles.json"))).toBe(false);
    // Must not include session transcripts (.jsonl)
    expect(paths.some(p => p.endsWith(".jsonl"))).toBe(false);
    // Must not include .env
    expect(paths.some(p => p === ".env")).toBe(false);
    // Must not include memory databases
    expect(paths.some(p => p.endsWith(".sqlite"))).toBe(false);
    // Must not include cron run logs
    expect(paths.some(p => p.includes(path.join("cron", "runs")))).toBe(false);
  });

  it("instance pack preserves agent directory structure", async () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "full"));
    const outputFile = path.join(tmpDir, "instance.harness");

    const result = await exportPack({
      sourcePath: instanceDir,
      outputPath: outputFile,
      packType: "instance",
    });

    const paths = result.manifest.includedPaths;
    // Should include agents/main/agent/auth-profiles.json
    expect(paths.some(p =>
      p === path.join("agents", "main", "agent", "auth-profiles.json")
    )).toBe(true);
    // Should include agents/main/sessions/abc123.jsonl
    expect(paths.some(p =>
      p === path.join("agents", "main", "sessions", "abc123.jsonl")
    )).toBe(true);
  });

  it("imports a pack to a new directory", async () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "source"));
    const packFile = path.join(tmpDir, "test.harness");
    const targetDir = path.join(tmpDir, "target");

    await exportPack({
      sourcePath: instanceDir,
      outputPath: packFile,
      packType: "template",
    });

    const importResult = await importPack({
      packFile,
      targetPath: targetDir,
    });

    expect(importResult.targetDir).toBe(targetDir);
    expect(importResult.manifest.packType).toBe("template");
    expect(importResult.manifest.image.imageId).toBe(importResult.manifest.packId);
    expect(importResult.manifest.lineage.layerOrder).toEqual([]);
    expect(importResult.manifest.harness.intent).toBe("agent-runtime-environment");
    expect(fs.existsSync(path.join(targetDir, "workspace", "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "openclaw.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, ".harness-manifest.json"))).toBe(true);
  });

  it("imports instance pack preserving agent directory structure", async () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "source"));
    const packFile = path.join(tmpDir, "instance.harness");
    const targetDir = path.join(tmpDir, "target");

    await exportPack({
      sourcePath: instanceDir,
      outputPath: packFile,
      packType: "instance",
    });

    await importPack({
      packFile,
      targetPath: targetDir,
    });

    // Verify agents directory structure is preserved
    expect(fs.existsSync(path.join(targetDir, "agents", "main", "agent", "auth-profiles.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "agents", "main", "sessions", "abc123.jsonl"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "credentials", "oauth.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "credentials", "whatsapp", "default", "creds.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "cron", "jobs.json"))).toBe(true);
  });

  it("imports config-defined external workspaces into target defaults", async () => {
    const { dir } = createMockInstanceWithCustomWorkspaces(path.join(tmpDir, "external-source"));
    const packFile = path.join(tmpDir, "external.harness");
    const targetDir = path.join(tmpDir, "external-target");

    const exportResult = await exportPack({
      sourcePath: dir,
      outputPath: packFile,
      packType: "template",
    });

    expect(exportResult.manifest.workspaces.map((workspace) => workspace.logicalPath)).toEqual([
      "workspace",
      "workspace-work",
    ]);

    const importResult = await importPack({
      packFile,
      targetPath: targetDir,
    });

    expect(fs.existsSync(path.join(targetDir, "workspace", "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "workspace-work", "AGENTS.md"))).toBe(true);

    const importedConfig = JSON.parse(fs.readFileSync(path.join(targetDir, "openclaw.json"), "utf-8"));
    expect(importedConfig.agents.defaults.workspace).toBe(path.join(targetDir, "workspace"));
    expect(importedConfig.agents.list[1].workspace).toBe(path.join(targetDir, "workspace-work"));
    expect(importResult.warnings.some((warning) => warning.includes("Rebound workspace paths"))).toBe(true);
  });

  it("full round-trip: export -> import -> verify", async () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "source"));
    const packFile = path.join(tmpDir, "roundtrip.harness");
    const targetDir = path.join(tmpDir, "target");

    const exportResult = await exportPack({
      sourcePath: instanceDir,
      outputPath: packFile,
      packType: "template",
    });

    const importResult = await importPack({
      packFile,
      targetPath: targetDir,
    });

    const verifyResult = verify(targetDir, importResult.manifest);
    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.errors).toHaveLength(0);
    expect(verifyResult.checks.some(c => c.name === "manifest_image" && c.passed)).toBe(true);
    expect(verifyResult.checks.some(c => c.name === "manifest_lineage" && c.passed)).toBe(true);
    expect(verifyResult.checks.some(c => c.name === "manifest_harness" && c.passed)).toBe(true);
  });

  it("full round-trip with instance pack", async () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "source"));
    const packFile = path.join(tmpDir, "roundtrip-instance.harness");
    const targetDir = path.join(tmpDir, "target");

    await exportPack({
      sourcePath: instanceDir,
      outputPath: packFile,
      packType: "instance",
    });

    const importResult = await importPack({
      packFile,
      targetPath: targetDir,
    });

    const verifyResult = verify(targetDir, importResult.manifest);
    expect(verifyResult.valid).toBe(true);
    expect(verifyResult.errors).toHaveLength(0);
    expect(verifyResult.checks.some(c => c.name === "manifest_image" && c.passed)).toBe(true);
  });
});

describe("verify", () => {
  it("passes for valid instance", () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "valid"));
    const result = verify(instanceDir);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails for non-existent directory", () => {
    const result = verify(path.join(tmpDir, "nonexistent"));
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("warns about missing workspace files", () => {
    const dir = path.join(tmpDir, "incomplete");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "openclaw.json"), "{}");
    const wsDir = path.join(dir, "workspace");
    fs.mkdirSync(wsDir);

    const result = verify(dir);
    expect(result.warnings.some(w => w.includes("AGENTS.md"))).toBe(true);
  });

  it("detects agent directories during verification", () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "verify-agents"));
    const result = verify(instanceDir);

    expect(result.checks.some(c => c.name === "agents_present" && c.passed)).toBe(true);
  });

  it("warns when manifest harness metadata is missing", () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "verify-harness"));
    const result = verify(instanceDir, {
      schemaVersion: "0.3.0",
      packType: "template",
      packId: "legacy-pack",
      createdAt: "2026-03-11T00:00:00.000Z",
      source: {
        product: "openclaw",
        version: "unknown",
        configPath: "openclaw.json",
      },
      includedPaths: ["openclaw.json", "workspace/AGENTS.md"],
      workspaces: [],
      sensitiveFlags: {
        hasCredentials: false,
        hasApiKeys: false,
        hasOAuthTokens: false,
        hasAuthProfiles: false,
        hasWhatsAppCreds: false,
        hasCopilotToken: false,
        hasSessions: false,
        hasMemoryDb: false,
        hasEnvFile: false,
      },
      riskLevel: "safe-share",
    } as any);

    expect(result.checks.some(c => c.name === "manifest_image" && !c.passed)).toBe(true);
    expect(result.checks.some(c => c.name === "manifest_lineage" && !c.passed)).toBe(true);
    expect(result.checks.some(c => c.name === "manifest_harness" && !c.passed)).toBe(true);
    expect(result.warnings.some(w => w.includes("reusable agent runtime environment"))).toBe(true);
  });
});

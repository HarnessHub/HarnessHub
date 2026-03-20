import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import * as tar from "tar";
import { inspect } from "../src/core/scanner.js";
import { exportPack, importPack } from "../src/core/packer.js";
import { composeHarness } from "../src/core/compose.js";
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
  it("composes a local child state on top of a parent materialization", () => {
    const parentDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "parent"));
    const childDir = createMockInstance(path.join(tmpDir, "child"));
    const repoDir = path.join(tmpDir, "repo");
    const outputDir = path.join(tmpDir, "composed");

    fs.mkdirSync(repoDir, { recursive: true });
    fs.writeFileSync(path.join(repoDir, "harness.definition.json"), JSON.stringify({
      schemaVersion: "0.2.0",
      kind: "harness-definition",
      image: { imageId: "child-agent", adapter: "openclaw" },
      lineage: {
        parentImage: { refType: "path", value: "../parent" },
        layerOrder: ["../parent", "child-agent"],
      },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["config", "workspace", "skills"],
      },
      bindings: {
        workspaces: [
          {
            agentId: "main",
            logicalPath: "workspace",
            targetRelativePath: "workspace",
            configTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
            required: true,
          },
        ],
      },
      rebinding: {
        workspaceTargetMode: "absolute-path",
        mutableConfigTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
      },
      source: {
        bootstrap: "starter",
        detectedProduct: null,
        configPath: null,
      },
      verify: {
        readinessTarget: "runtime_ready",
        expectedComponents: ["config", "workspace", "skills"],
        requireWorkspaceBindings: true,
      },
    }, null, 2));

    fs.writeFileSync(path.join(childDir, "workspace", "AGENTS.md"), "# Child Agent\n");
    fs.writeFileSync(path.join(childDir, "workspace", "CHILD.md"), "# Child Extra\n");
    fs.writeFileSync(path.join(childDir, "openclaw.json"), JSON.stringify({
      agents: {
        defaults: { workspace: path.join(childDir, "workspace") },
        list: [{ id: "main", default: true, workspace: path.join(childDir, "workspace") }],
      },
    }, null, 2));

    const result = composeHarness({
      cwd: repoDir,
      sourcePath: childDir,
      outputPath: outputDir,
    });

    expect(result.targetDir).toBe(outputDir);
    expect(result.parentImageId).toBe("parent");
    expect(fs.existsSync(path.join(outputDir, "workspace", "AGENTS.md"))).toBe(true);
    expect(fs.readFileSync(path.join(outputDir, "workspace", "AGENTS.md"), "utf8")).toContain("Child Agent");
    expect(fs.existsSync(path.join(outputDir, "workspace", "SOUL.md"))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, "credentials", "oauth.json"))).toBe(true);
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, "harness.definition.json"), "utf8")).lineage).toEqual({
      parentImage: { refType: "image-id", value: "parent" },
      layerOrder: ["parent", "child-agent"],
    });

    const composedConfig = JSON.parse(fs.readFileSync(path.join(outputDir, "openclaw.json"), "utf8"));
    expect(composedConfig.agents.defaults.workspace).toBe(path.join(outputDir, "workspace"));
  });

  it("fails compose when parent and child overlap on an unsupported passthrough root", () => {
    const parentDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "parent-conflict"));
    const childDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "child-conflict"));
    const repoDir = path.join(tmpDir, "repo-conflict");

    fs.mkdirSync(repoDir, { recursive: true });
    fs.writeFileSync(path.join(repoDir, "harness.definition.json"), JSON.stringify({
      schemaVersion: "0.2.0",
      kind: "harness-definition",
      image: { imageId: "child-agent", adapter: "openclaw" },
      lineage: {
        parentImage: { refType: "path", value: "../parent-conflict" },
        layerOrder: ["../parent-conflict", "child-agent"],
      },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["config", "workspace", "skills", "agents"],
      },
      bindings: {
        workspaces: [
          {
            agentId: "main",
            logicalPath: "workspace",
            targetRelativePath: "workspace",
            configTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
            required: true,
          },
        ],
      },
      rebinding: {
        workspaceTargetMode: "absolute-path",
        mutableConfigTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
      },
      source: {
        bootstrap: "starter",
        detectedProduct: null,
        configPath: null,
      },
      verify: {
        readinessTarget: "runtime_ready",
        expectedComponents: ["config", "workspace", "skills"],
        requireWorkspaceBindings: true,
      },
    }, null, 2));

    expect(() => composeHarness({
      cwd: repoDir,
      sourcePath: childDir,
      outputPath: path.join(tmpDir, "composed-conflict"),
    })).toThrow(/Unsupported component overlap during compose: \.env, agents, credentials, cron, memory/);

    expect(fs.existsSync(parentDir)).toBe(true);
  });

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
    expect(result.manifest.placement.persistedManifestPath).toBe(".harness-manifest.json");
    expect(result.manifest.placement.reservedRoots).toEqual(["config", "workspace", "workspaces", "reports", "state"]);
    expect(result.manifest.rebinding.workspaceTargetMode).toBe("absolute-path");
    expect(result.manifest.bindings.workspaces).toEqual([
      {
        agentId: "main",
        logicalPath: "workspace",
        targetRelativePath: "workspace",
        configTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
        required: true,
      },
    ]);
    expect(result.manifest.rebinding.mutableConfigTargets).toEqual([
      "agents.defaults.workspace",
      "agents.list[main].workspace",
    ]);
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

    await expect(exportPack({
      sourcePath: instanceDir,
      outputPath: outputFile,
      packType: "template",
    })).rejects.toThrow(/explicit pack-type override/);

    const result = await exportPack({
      sourcePath: instanceDir,
      outputPath: outputFile,
      packType: "template",
      allowPackTypeOverride: true,
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

  it("template pack excludes runtime-state directories by contract", async () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "contract"));
    fs.mkdirSync(path.join(instanceDir, "browser", "profile"), { recursive: true });
    fs.writeFileSync(path.join(instanceDir, "browser", "profile", "state.json"), "{}");
    fs.mkdirSync(path.join(instanceDir, "identity"), { recursive: true });
    fs.writeFileSync(path.join(instanceDir, "identity", "device.json"), "{}");
    const outputFile = path.join(tmpDir, "contract-template.harness");

    const result = await exportPack({
      sourcePath: instanceDir,
      outputPath: outputFile,
      packType: "template",
      allowPackTypeOverride: true,
    });

    expect(result.manifest.harness.components).not.toContain("agents");
    expect(result.manifest.harness.components).not.toContain("sessions");
    expect(result.manifest.harness.components).not.toContain("credentials");
    expect(result.manifest.harness.components).not.toContain("browser");
    expect(result.manifest.includedPaths.some((p) => p.startsWith("agents/"))).toBe(false);
    expect(result.manifest.includedPaths.some((p) => p.startsWith("credentials/"))).toBe(false);
    expect(result.manifest.includedPaths.some((p) => p.startsWith("memory/"))).toBe(false);
    expect(result.warnings.some((warning) => warning.includes("Inspect recommended instance"))).toBe(true);
  });

  it("instance export warns when template would be sufficient", async () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "template-source"));
    const outputFile = path.join(tmpDir, "template-source-instance.harness");

    const result = await exportPack({
      sourcePath: instanceDir,
      outputPath: outputFile,
      packType: "instance",
    });

    expect(result.policyWarnings.some((warning) => warning.includes("qualifies for template"))).toBe(true);
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
    expect(importResult.manifest.bindings.workspaces[0].targetRelativePath).toBe("workspace");
    expect(importResult.manifest.harness.intent).toBe("agent-runtime-environment");
    expect(fs.existsSync(path.join(targetDir, "workspace", "AGENTS.md"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, "openclaw.json"))).toBe(true);
    expect(fs.existsSync(path.join(targetDir, ".harness-manifest.json"))).toBe(true);
  });

  it("rejects importing a pack with an invalid manifest contract", async () => {
    const packFile = path.join(tmpDir, "invalid-manifest.harness");
    const stagingDir = path.join(tmpDir, "invalid-pack");
    fs.mkdirSync(path.join(stagingDir, "workspace"), { recursive: true });
    fs.writeFileSync(path.join(stagingDir, "workspace", "AGENTS.md"), "# Agent\n");
    fs.writeFileSync(path.join(stagingDir, "manifest.json"), JSON.stringify({
      schemaVersion: "0.5.0",
      packType: "template",
      packId: "broken-pack",
      createdAt: "2026-03-12T00:00:00.000Z",
      lineage: { parentImage: null, layerOrder: [] },
      bindings: { workspaces: [] },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["workspace", "config"],
      },
      source: {
        product: "openclaw",
        version: "unknown",
        configPath: "openclaw.json",
      },
      includedPaths: ["workspace/AGENTS.md"],
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
    }, null, 2));
    await tar.create({ gzip: true, file: packFile, cwd: stagingDir }, ["manifest.json", "workspace"]);

    await expect(importPack({
      packFile,
      targetPath: path.join(tmpDir, "broken-target"),
    })).rejects.toThrow(/Manifest contract validation failed/);
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
    expect(importResult.manifest.bindings.workspaces.map((binding) => binding.targetRelativePath)).toEqual([
      "workspace",
      "workspace-work",
    ]);
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
    expect(verifyResult.runtimeReady).toBe(true);
    expect(verifyResult.readinessClass).toBe("runtime_ready");
    expect(verifyResult.errors).toHaveLength(0);
    expect(verifyResult.checks.some(c => c.name === "manifest_image" && c.passed)).toBe(true);
    expect(verifyResult.checks.some(c => c.name === "manifest_lineage" && c.passed)).toBe(true);
    expect(verifyResult.checks.some(c => c.name === "manifest_placement" && c.passed)).toBe(true);
    expect(verifyResult.checks.some(c => c.name === "manifest_rebinding" && c.passed)).toBe(true);
    expect(verifyResult.checks.some(c => c.name === "binding_semantics" && c.passed)).toBe(true);
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
    expect(verifyResult.runtimeReady).toBe(true);
    expect(verifyResult.readinessClass).toBe("runtime_ready");
    expect(verifyResult.errors).toHaveLength(0);
    expect(verifyResult.checks.some(c => c.name === "manifest_image" && c.passed)).toBe(true);
    expect(verifyResult.checks.some(c => c.name === "binding_semantics" && c.passed)).toBe(true);
  });

  it("exports a composed output using the source-path definition snapshot", async () => {
    const parentDir = createMockInstance(path.join(tmpDir, "compose-export-parent"));
    const childDir = createMockInstance(path.join(tmpDir, "compose-export-child"));
    const repoDir = path.join(tmpDir, "compose-export-repo");
    const composedDir = path.join(tmpDir, "compose-export-output");
    const packFile = path.join(tmpDir, "compose-export.harness");

    fs.mkdirSync(repoDir, { recursive: true });
    fs.writeFileSync(path.join(repoDir, "harness.definition.json"), JSON.stringify({
      schemaVersion: "0.2.0",
      kind: "harness-definition",
      image: { imageId: "child-compose", adapter: "openclaw" },
      lineage: {
        parentImage: { refType: "path", value: "../compose-export-parent" },
        layerOrder: ["../compose-export-parent", "child-compose"],
      },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["config", "workspace", "skills"],
      },
      bindings: {
        workspaces: [
          {
            agentId: "main",
            logicalPath: "workspace",
            targetRelativePath: "workspace",
            configTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
            required: true,
          },
        ],
      },
      rebinding: {
        workspaceTargetMode: "absolute-path",
        mutableConfigTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
      },
      source: {
        bootstrap: "starter",
        detectedProduct: null,
        configPath: null,
      },
      verify: {
        readinessTarget: "runtime_ready",
        expectedComponents: ["config", "workspace", "skills"],
        requireWorkspaceBindings: true,
      },
    }, null, 2));

    composeHarness({
      cwd: repoDir,
      sourcePath: childDir,
      outputPath: composedDir,
    });

    const exportResult = await exportPack({
      sourcePath: composedDir,
      outputPath: packFile,
      packType: "template",
      cwd: tmpDir,
    });

    expect(exportResult.manifest.lineage.parentImage).toEqual({ imageId: "compose-export-parent" });
    expect(exportResult.manifest.lineage.layerOrder).toEqual(["compose-export-parent", exportResult.manifest.image.imageId]);
  });
});

describe("verify", () => {
  it("passes for valid instance", () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "valid"));
    const result = verify(instanceDir);

    expect(result.valid).toBe(true);
    expect(result.runtimeReady).toBe(true);
    expect(result.readinessClass).toBe("runtime_ready");
    expect(result.remediationSteps).toEqual([]);
    expect(result.errors).toHaveLength(0);
  });

  it("reports lineage-aware success for a composed local result with a definition snapshot", () => {
    const dir = createMockInstance(path.join(tmpDir, "verify-composed"));
    fs.writeFileSync(path.join(dir, "harness.definition.json"), JSON.stringify({
      schemaVersion: "0.2.0",
      kind: "harness-definition",
      image: { imageId: "child-compose", adapter: "openclaw" },
      lineage: {
        parentImage: { refType: "image-id", value: "base-compose" },
        layerOrder: ["base-compose", "child-compose"],
      },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["config", "workspace", "skills"],
      },
      bindings: {
        workspaces: [
          {
            agentId: "main",
            logicalPath: "workspace",
            targetRelativePath: "workspace",
            configTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
            required: true,
          },
        ],
      },
      rebinding: {
        workspaceTargetMode: "absolute-path",
        mutableConfigTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
      },
      source: {
        bootstrap: "starter",
        detectedProduct: null,
        configPath: null,
      },
      verify: {
        readinessTarget: "runtime_ready",
        expectedComponents: ["config", "workspace", "skills"],
        requireWorkspaceBindings: true,
      },
    }, null, 2));

    const definition = JSON.parse(fs.readFileSync(path.join(dir, "harness.definition.json"), "utf8"));
    const result = verify(dir, undefined, definition);

    expect(result.valid).toBe(true);
    expect(result.readinessClass).toBe("runtime_ready");
    expect(result.checks.some((check) => check.name === "lineage_declaration" && check.passed)).toBe(true);
    expect(result.checks.some((check) => check.name === "lineage_materialization" && check.passed)).toBe(true);
  });

  it("distinguishes lineage materialization failures from declaration failures", () => {
    const dir = createMockInstance(path.join(tmpDir, "verify-lineage-missing-skills"));
    fs.rmSync(path.join(dir, "workspace", "skills"), { recursive: true, force: true });
    const definition = {
      schemaVersion: "0.2.0",
      kind: "harness-definition",
      image: { imageId: "child-compose", adapter: "openclaw" },
      lineage: {
        parentImage: { refType: "image-id", value: "base-compose" },
        layerOrder: ["base-compose", "child-compose"],
      },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["config", "workspace", "skills"],
      },
      bindings: {
        workspaces: [
          {
            agentId: "main",
            logicalPath: "workspace",
            targetRelativePath: "workspace",
            configTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
            required: true,
          },
        ],
      },
      rebinding: {
        workspaceTargetMode: "absolute-path",
        mutableConfigTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
      },
      source: {
        bootstrap: "starter",
        detectedProduct: null,
        configPath: null,
      },
      verify: {
        readinessTarget: "runtime_ready",
        expectedComponents: ["config", "workspace", "skills"],
        requireWorkspaceBindings: true,
      },
    };

    const result = verify(dir, undefined, definition);
    expect(result.valid).toBe(true);
    expect(result.readinessClass).toBe("manual_steps_required");
    expect(result.checks.some((check) => check.name === "lineage_declaration" && check.passed)).toBe(true);
    expect(result.checks.some((check) => check.name === "lineage_materialization" && !check.passed)).toBe(true);
    expect(result.runtimeReadinessIssues).toContain("Lineage materialization missing expected component: skills");
  });

  it("fails verification when lineage declaration metadata is inconsistent", () => {
    const dir = createMockInstance(path.join(tmpDir, "verify-lineage-invalid"));
    const definition = {
      schemaVersion: "0.2.0",
      kind: "harness-definition",
      image: { imageId: "child-compose", adapter: "openclaw" },
      lineage: {
        parentImage: { refType: "image-id", value: "base-compose" },
        layerOrder: ["wrong-parent", "child-compose"],
      },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["config", "workspace", "skills"],
      },
      bindings: {
        workspaces: [
          {
            agentId: "main",
            logicalPath: "workspace",
            targetRelativePath: "workspace",
            configTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
            required: true,
          },
        ],
      },
      rebinding: {
        workspaceTargetMode: "absolute-path",
        mutableConfigTargets: ["agents.defaults.workspace", "agents.list[main].workspace"],
      },
      source: {
        bootstrap: "starter",
        detectedProduct: null,
        configPath: null,
      },
      verify: {
        readinessTarget: "runtime_ready",
        expectedComponents: ["config", "workspace", "skills"],
        requireWorkspaceBindings: true,
      },
    };

    const result = verify(dir, undefined, definition);
    expect(result.valid).toBe(false);
    expect(result.readinessClass).toBe("structurally_invalid");
    expect(result.checks.some((check) => check.name === "definition_contract" && !check.passed)).toBe(true);
  });

  it("fails for non-existent directory", () => {
    const result = verify(path.join(tmpDir, "nonexistent"));
    expect(result.valid).toBe(false);
    expect(result.runtimeReady).toBe(false);
    expect(result.readinessClass).toBe("structurally_invalid");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.remediationSteps).toContain("Import the .harness package into the target directory before running verify.");
  });

  it("warns about missing workspace files", () => {
    const dir = path.join(tmpDir, "incomplete");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "openclaw.json"), "{}");
    const wsDir = path.join(dir, "workspace");
    fs.mkdirSync(wsDir);

    const result = verify(dir);
    expect(result.runtimeReady).toBe(false);
    expect(result.readinessClass).toBe("manual_steps_required");
    expect(result.warnings.some(w => w.includes("AGENTS.md"))).toBe(true);
    expect(result.remediationSteps).toContain("Restore the required workspace instructions such as AGENTS.md, or re-export the source so the workspace contract is complete.");
  });

  it("detects agent directories during verification", () => {
    const instanceDir = createMockInstanceWithSensitiveData(path.join(tmpDir, "verify-agents"));
    const result = verify(instanceDir);

    expect(result.checks.some(c => c.name === "agents_present" && c.passed)).toBe(true);
    expect(result.runtimeReady).toBe(true);
    expect(result.readinessClass).toBe("runtime_ready");
  });

  it("fails when manifest contract metadata is missing", () => {
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

    expect(result.valid).toBe(false);
    expect(result.runtimeReady).toBe(false);
    expect(result.readinessClass).toBe("structurally_invalid");
    expect(result.checks.some(c => c.name === "manifest_contract" && !c.passed)).toBe(true);
    expect(result.errors.some((error) => error.includes("image must be an object"))).toBe(true);
    expect(result.errors.some((error) => error.includes("harness must be an object"))).toBe(true);
    expect(result.remediationSteps).toContain("Re-export the source with the current harness CLI so the imported manifest and pack-type contract are regenerated.");
  });

  it("fails verification when the manifest contract is invalid", () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "verify-invalid-manifest"));
    const result = verify(instanceDir, {
      schemaVersion: "0.5.0",
      packType: "template",
      packId: "broken-pack",
      createdAt: "2026-03-12T00:00:00.000Z",
      image: {
        imageId: "broken-pack",
        adapter: "",
      },
      lineage: {
        parentImage: null,
        layerOrder: [],
      },
      placement: {
        reservedRoots: ["config", "workspace", "workspaces", "reports", "state"],
        componentRoots: {
          config: "config",
          workspace: "workspace",
          workspaces: "workspaces",
          reports: "reports",
          state: "state",
        },
        persistedManifestPath: ".harness-manifest.json",
      },
      rebinding: {
        workspaceTargetMode: "absolute-path",
        mutableConfigTargets: [],
      },
      bindings: {
        workspaces: [],
      },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["workspace"],
      },
      source: {
        product: "openclaw",
        version: "unknown",
        configPath: "openclaw.json",
      },
      includedPaths: [],
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

    expect(result.valid).toBe(false);
    expect(result.readinessClass).toBe("structurally_invalid");
    expect(result.checks.some((check) => check.name === "manifest_contract" && !check.passed)).toBe(true);
    expect(result.errors.some((error) => error.includes("image.adapter"))).toBe(true);
  });

  it("fails verification when a template manifest declares forbidden runtime-state components", () => {
    const instanceDir = createMockInstance(path.join(tmpDir, "verify-pack-contract"));
    const result = verify(instanceDir, {
      schemaVersion: "0.5.0",
      packType: "template",
      packId: "template-with-agents",
      createdAt: "2026-03-12T00:00:00.000Z",
      image: {
        imageId: "template-with-agents",
        adapter: "openclaw",
      },
      lineage: {
        parentImage: null,
        layerOrder: [],
      },
      placement: {
        reservedRoots: ["config", "workspace", "workspaces", "reports", "state"],
        componentRoots: {
          config: "config",
          workspace: "workspace",
          workspaces: "workspaces",
          reports: "reports",
          state: "state",
        },
        persistedManifestPath: ".harness-manifest.json",
      },
      rebinding: {
        workspaceTargetMode: "absolute-path",
        mutableConfigTargets: [],
      },
      bindings: {
        workspaces: [],
      },
      harness: {
        intent: "agent-runtime-environment",
        targetProduct: "openclaw",
        components: ["workspace", "config", "agents"],
      },
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

    expect(result.valid).toBe(false);
    expect(result.runtimeReady).toBe(false);
    expect(result.readinessClass).toBe("structurally_invalid");
    expect(result.checks.some((check) => check.name === "pack_type_contract" && !check.passed)).toBe(true);
    expect(result.errors.some((error) => error.includes("template packs must not include agents"))).toBe(true);
  });
});

import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { inspect, resolveStateDir } from "../src/core/scanner.js";
import { verify } from "../src/core/verifier.js";

let tempRoots: string[] = [];

afterEach(() => {
  for (const dir of tempRoots) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempRoots = [];
  delete process.env.OPENCLAW_STATE_DIR;
  delete process.env.CLAWDBOT_STATE_DIR;
  delete process.env.OPENCLAW_PROFILE;
  delete process.env.OPENCLAW_CONFIG_PATH;
  delete process.env.CLAWDBOT_CONFIG_PATH;
});

function makeTempDir(prefix: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempRoots.push(dir);
  return dir;
}

function createMinimalInstance(dir: string) {
  fs.mkdirSync(path.join(dir, "workspace"), { recursive: true });
  fs.writeFileSync(path.join(dir, "workspace", "AGENTS.md"), "# Agent\n", "utf8");
  fs.writeFileSync(path.join(dir, "openclaw.json"), "{agents:{defaults:{workspace:\"./workspace\"}}}", "utf8");
}

describe("scanner and verifier edge coverage", () => {
  it("prefers environment-configured state and config paths", () => {
    const stateDir = makeTempDir("harnesshub-scanner-env-");
    createMinimalInstance(stateDir);
    const configPath = path.join(stateDir, "custom-openclaw.json");
    fs.writeFileSync(configPath, "{identity:{name:'custom'}}", "utf8");

    process.env.OPENCLAW_STATE_DIR = stateDir;
    process.env.OPENCLAW_CONFIG_PATH = configPath;

    expect(resolveStateDir()).toBe(stateDir);
    const result = inspect();
    expect(result.detected).toBe(true);
    expect(result.configPath).toBe(configPath);
  });

  it("detects config backups, malformed cron jobs, and internal-only template risk", () => {
    const stateDir = makeTempDir("harnesshub-scanner-legacy-");
    fs.mkdirSync(path.join(stateDir, "workspace"), { recursive: true });
    fs.writeFileSync(path.join(stateDir, "workspace", "AGENTS.md"), "# Agent\n", "utf8");
    fs.writeFileSync(path.join(stateDir, "openclaw.json"), "{gateway:{apiKey:'sk-test'}}", "utf8");
    fs.writeFileSync(path.join(stateDir, "openclaw.json.bak"), "{}", "utf8");
    fs.mkdirSync(path.join(stateDir, "cron"), { recursive: true });
    fs.writeFileSync(path.join(stateDir, "cron", "jobs.json"), "{invalid", "utf8");
    fs.writeFileSync(path.join(stateDir, "version"), "1.2.3\n", "utf8");

    const result = inspect(stateDir);
    expect(result.structure.configFiles).toContain("openclaw.json.bak");
    expect(result.structure.cronJobs).toEqual(["(present)"]);
    expect(result.version).toBe("1.2.3");
    expect(result.recommendedPackType).toBe("template");
    expect(result.riskAssessment).toBe("internal-only");
    expect(result.warnings).toContain("Config contains API keys or tokens");
  });

  it("treats legacy session stores as migration-oriented state", () => {
    const stateDir = makeTempDir("harnesshub-scanner-sessions-");
    fs.mkdirSync(path.join(stateDir, "workspace"), { recursive: true });
    fs.writeFileSync(path.join(stateDir, "workspace", "AGENTS.md"), "# Agent\n", "utf8");
    fs.writeFileSync(path.join(stateDir, "openclaw.json"), "{}", "utf8");
    fs.writeFileSync(path.join(stateDir, "sessions-legacy.json5"), "{sessions:[]}", "utf8");

    const result = inspect(stateDir);
    expect(result.structure.sessionFiles).toContain("sessions-legacy.json5");
    expect(result.recommendedPackType).toBe("instance");
  });

  it("uses profile-specific state directories when available", () => {
    const home = os.homedir();
    const profileDir = path.join(home, ".openclaw-coverage-profile");
    tempRoots.push(profileDir);
    fs.mkdirSync(profileDir, { recursive: true });
    process.env.OPENCLAW_PROFILE = "coverage-profile";

    expect(resolveStateDir()).toBe(profileDir);
  });

  it("reports manual remediation for invalid config, missing workspaces, and unreadable files", () => {
    const targetDir = makeTempDir("harnesshub-verify-issues-");
    fs.mkdirSync(path.join(targetDir, "workspace"), { recursive: true });
    fs.writeFileSync(path.join(targetDir, "openclaw.json"), "{broken", "utf8");
    fs.writeFileSync(path.join(targetDir, "workspace", "AGENTS.md"), "# Agent\n", "utf8");
    fs.chmodSync(path.join(targetDir, "workspace", "AGENTS.md"), 0o000);

    const result = verify(targetDir, {
      schemaVersion: "0.5.0",
      packType: "template",
      packId: "verify-edge-pack",
      createdAt: "2026-03-17T00:00:00.000Z",
      image: { imageId: "verify-edge-pack", adapter: "openclaw" },
      lineage: { parentImage: null, layerOrder: [] },
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
        mutableConfigTargets: ["agents.defaults.workspace"],
      },
      bindings: {
        workspaces: [
          {
            agentId: "main",
            logicalPath: "workspace",
            targetRelativePath: "workspace",
            configTargets: ["agents.defaults.workspace"],
            required: true,
          },
          {
            agentId: "work",
            logicalPath: "workspace-work",
            targetRelativePath: "workspace-work",
            configTargets: ["agents.list[work].workspace"],
            required: true,
          },
        ],
      },
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
      includedPaths: ["openclaw.json", "workspace/AGENTS.md", "workspace-work/AGENTS.md"],
      workspaces: [
        { agentId: "main", logicalPath: "workspace", packPath: "workspace", isDefault: true },
        { agentId: "work", logicalPath: "workspace-work", packPath: "workspaces/work", isDefault: false },
      ],
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

    fs.chmodSync(path.join(targetDir, "workspace", "AGENTS.md"), 0o644);

    expect(result.valid).toBe(true);
    expect(result.runtimeReady).toBe(false);
    expect(result.readinessClass).toBe("manual_steps_required");
    expect(result.warnings.some((warning) => warning.includes("Could not parse config"))).toBe(true);
    expect(result.warnings.some((warning) => warning.includes("Missing imported workspace: workspace-work"))).toBe(true);
    expect(result.remediationSteps).toContain("Repair openclaw.json to valid JSON/JSON5 and rerun import if rebinding did not complete cleanly.");
    expect(result.remediationSteps).toContain("Re-import the pack so all declared workspaces are materialized into the target directory.");
  });
});

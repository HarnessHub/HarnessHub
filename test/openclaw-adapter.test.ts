import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { openClawAdapter } from "../src/core/adapters/openclaw.js";

let tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

function makeTempDir(prefix: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function makeManifest() {
  return {
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
    rebinding: {
      mutableConfigTargets: ["agents.defaults.workspace", "agents.list[work].workspace"],
    },
  } as any;
}

describe("openclaw adapter rebinding", () => {
  it("returns early when there is no config file or workspace bindings", () => {
    const targetDir = makeTempDir("harnesshub-openclaw-rebind-empty-");
    const warnings: string[] = [];

    openClawAdapter.rebindImportedConfig(targetDir, { bindings: { workspaces: [] }, rebinding: { mutableConfigTargets: [] } } as any, warnings);
    expect(warnings).toEqual([]);
  });

  it("warns when config parsing fails", () => {
    const targetDir = makeTempDir("harnesshub-openclaw-rebind-bad-");
    fs.writeFileSync(path.join(targetDir, "openclaw.json"), "{broken", "utf8");
    const warnings: string[] = [];

    openClawAdapter.rebindImportedConfig(targetDir, makeManifest(), warnings);
    expect(warnings).toContain(`Could not parse config for workspace rebinding: openclaw.json`);
  });

  it("rewrites default and agent workspace bindings", () => {
    const targetDir = makeTempDir("harnesshub-openclaw-rebind-good-");
    fs.writeFileSync(path.join(targetDir, "openclaw.json"), JSON.stringify({
      agents: {
        defaults: { workspace: "/old/workspace" },
        list: [
          { id: "main", workspace: "/old/workspace" },
          { id: "work", workspace: "/old/workspace-work" },
        ],
      },
    }, null, 2), "utf8");
    const warnings: string[] = [];

    openClawAdapter.rebindImportedConfig(targetDir, makeManifest(), warnings);

    const config = JSON.parse(fs.readFileSync(path.join(targetDir, "openclaw.json"), "utf8"));
    expect(config.agents.defaults.workspace).toBe(`${targetDir}/workspace`);
    expect(config.agents.list[1].workspace).toBe(`${targetDir}/workspace-work`);
    expect(warnings[0]).toContain("Rebound workspace paths in openclaw.json");
  });

  it("initializes missing agents/defaults/list objects before rebinding", () => {
    const targetDir = makeTempDir("harnesshub-openclaw-rebind-init-");
    fs.writeFileSync(path.join(targetDir, "openclaw.json"), "{}", "utf8");
    const warnings: string[] = [];

    openClawAdapter.rebindImportedConfig(targetDir, {
      bindings: {
        workspaces: [{
          agentId: "main",
          logicalPath: "workspace",
          targetRelativePath: "workspace",
          configTargets: ["agents.defaults.workspace"],
          required: true,
        }],
      },
      rebinding: {
        mutableConfigTargets: ["agents.defaults.workspace"],
      },
    } as any, warnings);

    const config = JSON.parse(fs.readFileSync(path.join(targetDir, "openclaw.json"), "utf8"));
    expect(config.agents.defaults.workspace).toBe(`${targetDir}/workspace`);
    expect(config.agents.list).toEqual([]);
    expect(warnings).toHaveLength(1);
  });

  it("does not rewrite or warn when the config already matches", () => {
    const targetDir = makeTempDir("harnesshub-openclaw-rebind-stable-");
    fs.writeFileSync(path.join(targetDir, "openclaw.json"), JSON.stringify({
      agents: {
        defaults: { workspace: `${targetDir}/workspace` },
        list: [
          { id: "work", workspace: `${targetDir}/workspace-work` },
        ],
      },
    }, null, 2), "utf8");
    const warnings: string[] = [];

    openClawAdapter.rebindImportedConfig(targetDir, makeManifest(), warnings);
    expect(warnings).toEqual([]);
  });
});

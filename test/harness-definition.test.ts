import { afterEach, beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  HARNESS_DEFINITION_FILE,
  HARNESS_DEFINITION_SCHEMA_VERSION,
} from "../src/core/types.js";
import {
  assertValidHarnessDefinition,
  initHarnessDefinition,
  readHarnessDefinition,
  validateHarnessDefinition,
} from "../src/core/definition.js";

function createOpenClawSource(dir: string) {
  fs.mkdirSync(path.join(dir, "workspace", "skills", "demo"), { recursive: true });
  fs.writeFileSync(path.join(dir, "openclaw.json"), JSON.stringify({
    identity: { name: "Demo Agent" },
    agents: {
      defaults: { workspace: path.join(dir, "workspace") },
      list: [{ id: "main", default: true, workspace: path.join(dir, "workspace") }],
    },
  }, null, 2));
  fs.writeFileSync(path.join(dir, "workspace", "AGENTS.md"), "# Agent\n");
  fs.writeFileSync(path.join(dir, "workspace", "skills", "demo", "SKILL.md"), "---\nname: demo\ndescription: demo\n---\n");
}

function makeValidDefinition() {
  return {
    schemaVersion: HARNESS_DEFINITION_SCHEMA_VERSION,
    kind: "harness-definition",
    image: {
      imageId: "demo-agent",
      adapter: "openclaw",
    },
    lineage: {
      parentImage: null,
      layerOrder: [],
    },
    harness: {
      intent: "agent-runtime-environment",
      targetProduct: "openclaw",
      components: ["config", "workspace", "skills"],
    },
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
      workspaceTargetMode: "absolute-path",
      mutableConfigTargets: ["agents.defaults.workspace"],
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
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-definition-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("harness definition contract", () => {
  it("accepts a valid definition", () => {
    expect(validateHarnessDefinition(makeValidDefinition())).toEqual([]);
    expect(() => assertValidHarnessDefinition(makeValidDefinition())).not.toThrow();
  });

  it("rejects invalid nested fields", () => {
    const definition = makeValidDefinition() as any;
    definition.schemaVersion = "bad";
    definition.kind = "wrong";
    definition.image = { imageId: "", adapter: "other" };
    definition.lineage = { parentImage: { refType: "remote", value: "" }, layerOrder: [42] };
    definition.harness = { intent: "wrong", targetProduct: "", components: ["unknown"] };
    definition.bindings = {
      workspaces: [{
        agentId: "",
        logicalPath: "",
        targetRelativePath: "",
        configTargets: [42],
        required: "yes",
      }],
    };
    definition.rebinding = { workspaceTargetMode: "relative", mutableConfigTargets: [42] };
    definition.source = { bootstrap: "other", detectedProduct: 42, configPath: 7 };
    definition.verify = {
      readinessTarget: "unknown",
      expectedComponents: ["bad"],
      requireWorkspaceBindings: "yes",
    };

    const errors = validateHarnessDefinition(definition);
    expect(errors).toContain(`schemaVersion must be ${HARNESS_DEFINITION_SCHEMA_VERSION}`);
    expect(errors).toContain("kind must be one of: harness-definition");
    expect(errors).toContain("image.imageId must be a non-empty string");
    expect(errors).toContain("image.adapter must be one of: openclaw");
    expect(errors).toContain("lineage.parentImage.refType must be one of: image-id, path");
    expect(errors).toContain("lineage.parentImage.value must be a non-empty string");
    expect(errors).toContain("lineage.layerOrder must be an array of strings");
    expect(errors).toContain("harness.intent must be one of: agent-runtime-environment");
    expect(errors).toContain("bindings.workspaces[0].required must be a boolean");
    expect(errors).toContain("rebinding.workspaceTargetMode must be absolute-path");
    expect(errors).toContain("source.bootstrap must be one of: starter, openclaw-path");
    expect(errors).toContain("verify.requireWorkspaceBindings must be a boolean");
  });
});

describe("initHarnessDefinition", () => {
  it("creates a starter definition in the current directory", () => {
    const cwd = path.join(tmpDir, "demo-agent");
    fs.mkdirSync(cwd, { recursive: true });

    const result = initHarnessDefinition({ cwd });

    expect(result.definitionFile).toBe(path.join(cwd, HARNESS_DEFINITION_FILE));
    expect(result.initializedFrom).toBe("starter");
    expect(result.definition.image.imageId).toBe("demo-agent");
    expect(result.definition.harness.components).toEqual(["config", "workspace", "skills"]);

    const written = readHarnessDefinition(result.definitionFile);
    expect(written.source.bootstrap).toBe("starter");
  });

  it("bootstraps a definition from an OpenClaw source path", () => {
    const cwd = path.join(tmpDir, "repo");
    const sourceDir = path.join(tmpDir, "openclaw-source");
    fs.mkdirSync(cwd, { recursive: true });
    createOpenClawSource(sourceDir);

    const result = initHarnessDefinition({
      cwd,
      sourcePath: sourceDir,
    });

    expect(result.initializedFrom).toBe("openclaw-path");
    expect(result.definition.image.imageId).toBe("demo-agent");
    expect(result.definition.harness.components).toContain("config");
    expect(result.definition.harness.components).toContain("workspace");
    expect(result.definition.harness.components).toContain("skills");
    expect(result.definition.source.configPath).toBe("openclaw.json");
    expect(result.definition.bindings.workspaces).toEqual([
      expect.objectContaining({
        agentId: "main",
        logicalPath: "workspace",
        targetRelativePath: "workspace",
      }),
    ]);
  });

  it("rejects overwriting an existing definition without force", () => {
    const cwd = path.join(tmpDir, "repo");
    fs.mkdirSync(cwd, { recursive: true });
    fs.writeFileSync(path.join(cwd, HARNESS_DEFINITION_FILE), "{}\n");

    expect(() => initHarnessDefinition({ cwd })).toThrow(/Definition file already exists/);
  });
});

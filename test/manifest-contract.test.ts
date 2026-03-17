import { describe, expect, it } from "vitest";
import { assertValidManifest, validateManifestContract } from "../src/core/manifest.js";

function makeValidManifest() {
  return {
    schemaVersion: "0.5.0",
    packType: "template",
    packId: "pack-1",
    createdAt: "2026-03-17T00:00:00.000Z",
    image: {
      imageId: "pack-1",
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
    includedPaths: ["openclaw.json", "workspace/AGENTS.md"],
    workspaces: [
      {
        agentId: "main",
        logicalPath: "workspace",
        packPath: "workspace",
        isDefault: true,
      },
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
  };
}

describe("manifest contract coverage", () => {
  it("accepts a valid manifest", () => {
    expect(validateManifestContract(makeValidManifest())).toEqual([]);
    expect(() => assertValidManifest(makeValidManifest())).not.toThrow();
  });

  it("rejects non-object manifests immediately", () => {
    expect(validateManifestContract("broken")).toEqual(["manifest must be an object"]);
  });

  it("reports invalid nested contract fields across the manifest surface", () => {
    const manifest = makeValidManifest() as any;
    manifest.schemaVersion = "0.4.0";
    manifest.packType = "bad-pack-type";
    manifest.image = { imageId: "", adapter: "" };
    manifest.lineage = { parentImage: { imageId: "" }, layerOrder: [42] };
    manifest.placement = {
      reservedRoots: "workspace",
      componentRoots: {
        config: "",
        workspace: "",
        workspaces: "",
        reports: "",
        state: "",
      },
      persistedManifestPath: "",
    };
    manifest.rebinding = {
      workspaceTargetMode: "relative-path",
      mutableConfigTargets: [42],
    };
    manifest.bindings = {
      workspaces: [{
        agentId: "",
        logicalPath: "",
        targetRelativePath: "",
        configTargets: [42],
        required: "yes",
      }],
    };
    manifest.harness = {
      intent: "wrong",
      targetProduct: "",
      components: [42],
    };
    manifest.source = {
      product: "",
      version: "",
      configPath: 42,
    };
    manifest.includedPaths = [42];
    manifest.workspaces = [{
      agentId: "",
      logicalPath: "",
      packPath: "",
      isDefault: "yes",
    }];
    manifest.sensitiveFlags = {
      hasCredentials: "yes",
    };
    manifest.riskLevel = "risky";

    const errors = validateManifestContract(manifest);
    expect(errors).toContain("schemaVersion must be 0.5.0");
    expect(errors).toContain("packType must be one of: template, instance");
    expect(errors).toContain("image.imageId must be a non-empty string");
    expect(errors).toContain("image.adapter must be a non-empty string");
    expect(errors).toContain("lineage.parentImage must be null or an object with imageId");
    expect(errors).toContain("lineage.layerOrder must be an array of strings");
    expect(errors).toContain("placement.reservedRoots must be an array of strings");
    expect(errors).toContain("rebinding.workspaceTargetMode must be absolute-path");
    expect(errors).toContain("bindings.workspaces[0].required must be a boolean");
    expect(errors).toContain("harness.intent must be one of: agent-runtime-environment");
    expect(errors).toContain("source.configPath must be a string");
    expect(errors).toContain("includedPaths must be an array of strings");
    expect(errors).toContain("workspaces[0].isDefault must be a boolean");
    expect(errors).toContain("sensitiveFlags.hasCredentials must be a boolean");
    expect(errors).toContain("riskLevel must be one of: safe-share, internal-only, trusted-migration-only");
  });

  it("throws a combined manifest validation error", () => {
    expect(() => assertValidManifest({})).toThrow(/Manifest contract validation failed/);
  });
});

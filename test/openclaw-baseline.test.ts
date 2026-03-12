import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baselinePath = path.join(repoRoot, "docs", "validation", "openclaw-e2e-validation.json");

describe("committed OpenClaw validation baseline", () => {
  it("captures the expected stable semantics of the real validation artifact", () => {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));

    expect(baseline.sourceDir).toBe("~/.openclaw");
    expect(baseline.artifactPath).toMatch(/^\.artifacts\/openclaw-e2e\/.+\/openclaw-template\.harness$/);
    expect(baseline.artifactSizeBytes).toBeGreaterThan(0);

    expect(baseline.inspect).toMatchObject({
      detected: true,
      product: "openclaw",
      configPath: "openclaw.json",
      recommendedPackType: "instance",
      riskAssessment: "trusted-migration-only",
      workspaceDirs: ["workspace"],
      agentIds: ["main"],
    });
    expect(baseline.inspect.warnings).toEqual(
      expect.arrayContaining([
        expect.stringContaining("API keys"),
        expect.stringContaining("auth-profiles.json"),
        expect.stringContaining("Credentials directory"),
      ]),
    );

    expect(baseline.export).toMatchObject({
      success: true,
      packType: "template",
      riskLevel: "internal-only",
    });
    expect(baseline.export.policyWarnings).toEqual([
      "Inspect recommended instance; exporting template diverges from the recommended pack type.",
    ]);

    expect(baseline.manifest.schemaVersion).toBe("0.5.0");
    expect(baseline.manifest.image.adapter).toBe("openclaw");
    expect(baseline.manifest.lineage).toEqual({
      parentImage: null,
      layerOrder: [],
    });
    expect(baseline.manifest.harness).toEqual({
      intent: "agent-runtime-environment",
      targetProduct: "openclaw",
      components: ["workspace", "config", "skills", "cron", "extensions", "completions"],
    });
    expect(baseline.manifest.bindingWorkspaceCount).toBe(1);

    expect(baseline.import.success).toBe(true);
    expect(baseline.import.targetDir).toMatch(/^\.artifacts\/openclaw-e2e\/.+\/imported$/);
    expect(baseline.import.warnings).toEqual([
      expect.stringContaining("Rebound workspace paths in openclaw.json"),
    ]);

    expect(baseline.verify).toMatchObject({
      valid: true,
      readinessClass: "runtime_ready",
      readinessSummary: "Imported harness is structurally valid and ready to run without additional manual steps.",
      runtimeReady: true,
      runtimeReadinessIssues: [],
      warnings: [],
      errors: [],
    });
    expect(baseline.verify.checkNames).toEqual([
      "directory_exists",
      "config_exists",
      "workspace_exists",
      "workspace_file_agents.md",
      "config_valid",
      "manifest_contract",
      "manifest_schema",
      "manifest_pack_type",
      "manifest_placement",
      "manifest_rebinding",
      "pack_type_contract",
      "manifest_image",
      "manifest_lineage",
      "manifest_harness",
      "workspace_bindings",
      "binding_semantics",
      "file_count",
      "workspace_readable",
    ]);
  });
});

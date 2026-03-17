import { afterEach, describe, expect, it, vi } from "vitest";
import { formatOutput, printInspectResult, printVerifyResult } from "../src/utils/output.js";

describe("output formatting", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("formats json output directly", () => {
    expect(formatOutput({ riskLevel: "safe-share" }, "json")).toContain("\"riskLevel\": \"safe-share\"");
  });

  it("formats text output with humanized keys and arrays", () => {
    const formatted = formatOutput({
      riskLevel: "trusted-migration-only",
      runtimeReady: true,
      warnings: ["credentials detected"],
      nestedObject: { packType: "instance" },
      emptyList: [],
      absentValue: null,
    }, "text");

    expect(formatted).toContain("Risk level: trusted-migration-only");
    expect(formatted).toContain("Runtime ready: yes");
    expect(formatted).toContain("Warnings:");
    expect(formatted).toContain("- credentials detected");
    expect(formatted).toContain("Nested object:");
    expect(formatted).toContain("Pack type: instance");
    expect(formatted).toContain("Empty list: (none)");
    expect(formatted).toContain("Absent value: -");
  });

  it("formats primitive values and object arrays in text mode", () => {
    expect(formatOutput(true, "text")).toBe("true");
    expect(formatOutput(42, "text")).toBe("42");
    expect(formatOutput("ready", "text")).toBe("ready");

    const formatted = formatOutput({
      checks: [
        { passed: true, message: "manifest ok" },
        { passed: false, message: "workspace missing" },
      ],
    }, "text");

    expect(formatted).toContain("Checks:");
    expect(formatted).toContain("Passed: yes");
    expect(formatted).toContain("Message: manifest ok");
    expect(formatted).toContain("Passed: no");
    expect(formatted).toContain("Message: workspace missing");
  });

  it("prints inspect results in text mode with workflow guidance and warnings", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    printInspectResult({
      detected: true,
      stateDir: "/tmp/.openclaw",
      configPath: "/tmp/.openclaw/openclaw.json",
      product: "openclaw",
      version: null,
      structure: {
        hasConfig: true,
        hasWorkspace: true,
        workspaceDirs: ["workspace"],
        hasAgents: true,
        agentIds: ["main"],
        hasSessions: true,
        sessionFiles: ["agents/main/sessions/a.jsonl"],
        hasMemory: true,
        hasCredentials: true,
        hasSkills: true,
        skillDirs: ["docs"],
        hasCron: true,
        cronJobs: ["daily"],
        hasHooks: false,
        hasExtensions: true,
        hasLogs: false,
        hasBrowser: false,
        hasCompletions: true,
        workspaceFiles: ["workspace/AGENTS.md", "workspace/SOUL.md"],
      },
      sensitiveFlags: {
        hasApiKeys: true,
        hasAuthProfiles: true,
        hasCredentials: true,
        hasOAuthTokens: false,
        hasWhatsAppCreds: false,
        hasCopilotToken: false,
        hasSessions: true,
        hasMemoryDb: true,
        hasEnvFile: false,
      },
      recommendedPackType: "instance",
      riskAssessment: "trusted-migration-only",
      warnings: ["Config contains API keys or tokens"],
      workflow: {
        recommendationSummary: "Use instance for migration.",
        recommendedExportCommand: "harness export -t instance",
        overrideExportCommand: "harness export -t template --allow-pack-type-override",
      },
    }, "text");

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("=== HarnessHub Inspect ===");
    expect(output).toContain("Pack type:    instance");
    expect(output).toContain("Risk level:   trusted-migration-only");
    expect(output).toContain("Export:       harness export -t instance");
    expect(output).toContain("Override:     harness export -t template --allow-pack-type-override");
    expect(output).toContain("! Config contains API keys or tokens");
  });

  it("prints inspect results in json mode", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    printInspectResult({ detected: true, recommendedPackType: "template" }, "json");

    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0]?.[0]).toContain("\"recommendedPackType\": \"template\"");
  });

  it("prints inspect results without override or warnings", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    printInspectResult({
      detected: false,
      stateDir: "/tmp/.openclaw",
      configPath: null,
      product: "openclaw",
      version: "1.2.3",
      structure: {
        hasConfig: false,
        hasWorkspace: false,
        workspaceDirs: [],
        hasAgents: false,
        agentIds: [],
        hasSessions: false,
        sessionFiles: [],
        hasMemory: false,
        hasCredentials: false,
        hasSkills: false,
        skillDirs: [],
        hasCron: false,
        cronJobs: [],
        hasHooks: false,
        hasExtensions: false,
        hasLogs: false,
        hasBrowser: false,
        hasCompletions: false,
        workspaceFiles: [],
      },
      sensitiveFlags: {
        hasApiKeys: false,
        hasAuthProfiles: false,
        hasCredentials: false,
        hasOAuthTokens: false,
        hasWhatsAppCreds: false,
        hasCopilotToken: false,
        hasSessions: false,
        hasMemoryDb: false,
        hasEnvFile: false,
      },
      recommendedPackType: "template",
      riskAssessment: "safe-share",
      warnings: [],
      workflow: {
        recommendationSummary: "Use template for sharing.",
        recommendedExportCommand: "harness export -t template",
      },
    }, "text");

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("Detected:     no");
    expect(output).toContain("Config:       (none)");
    expect(output).toContain("Version:      1.2.3");
    expect(output).toContain("Workspaces:   none");
    expect(output).toContain("Agents:       none");
    expect(output).toContain("Export:       harness export -t template");
    expect(output).not.toContain("Override:");
    expect(output).not.toContain("--- Warnings ---");
  });

  it("prints verify results with readiness issues, remediation, warnings, and errors", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    printVerifyResult({
      valid: false,
      readinessClass: "manual_steps_required",
      runtimeReady: false,
      readinessSummary: "Needs manual repair.",
      checks: [
        { passed: true, message: "Manifest contract is valid" },
        { passed: false, message: "Workspace binding missing" },
      ],
      warnings: ["Config comments were normalized."],
      runtimeReadinessIssues: ["Workspace path still points to the old machine."],
      remediationSteps: ["Re-run import with the intended target path."],
      errors: ["Imported target is incomplete."],
    }, "text");

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("=== HarnessHub Verify ===");
    expect(output).toContain("Structural restore: NO");
    expect(output).toContain("Readiness class:    manual_steps_required");
    expect(output).toContain("[+] Manifest contract is valid");
    expect(output).toContain("[-] Workspace binding missing");
    expect(output).toContain("! Config comments were normalized.");
    expect(output).toContain("! Workspace path still points to the old machine.");
    expect(output).toContain("-> Re-run import with the intended target path.");
    expect(output).toContain("X Imported target is incomplete.");
  });

  it("prints verify results in json mode", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    printVerifyResult({ valid: true, readinessClass: "runtime_ready" }, "json");

    expect(log).toHaveBeenCalledOnce();
    expect(log.mock.calls[0]?.[0]).toContain("\"readinessClass\": \"runtime_ready\"");
  });

  it("prints verify results without optional sections", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    printVerifyResult({
      valid: true,
      readinessClass: "runtime_ready",
      runtimeReady: true,
      readinessSummary: "Ready to run.",
      checks: [],
      warnings: [],
      runtimeReadinessIssues: [],
      remediationSteps: [],
      errors: [],
    }, "text");

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("Structural restore: YES");
    expect(output).toContain("Runtime ready:      YES");
    expect(output).not.toContain("--- Checks ---");
    expect(output).not.toContain("--- Warnings ---");
    expect(output).not.toContain("--- Runtime Readiness Issues ---");
    expect(output).not.toContain("--- Recommended Next Steps ---");
    expect(output).not.toContain("--- Errors ---");
  });
});

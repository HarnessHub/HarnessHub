import { afterEach, describe, expect, it, vi } from "vitest";
import { Command } from "commander";

async function importFresh<T>(path: string): Promise<T> {
  vi.resetModules();
  return import(path) as Promise<T>;
}

describe("command entrypoints", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    process.exitCode = undefined;
  });

  it("adds workflow guidance to inspect results and renders text output", async () => {
    const inspect = vi.fn(() => ({
      detected: true,
      stateDir: "/tmp/openclaw",
      recommendedPackType: "instance",
      warnings: [],
    }));
    const printInspectResult = vi.fn();

    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: { inspect },
    }));
    vi.doMock("../src/utils/output.js", () => ({
      printInspectResult,
    }));

    const { inspectCommand } = await importFresh<typeof import("../src/commands/inspect.js")>("../src/commands/inspect.js");
    await inspectCommand.parseAsync(["node", "inspect", "-f", "text"], { from: "node" });

    expect(inspect).toHaveBeenCalledWith(undefined);
    expect(printInspectResult).toHaveBeenCalledOnce();
    expect(printInspectResult.mock.calls[0]?.[1]).toBe("text");
    expect(printInspectResult.mock.calls[0]?.[0]).toMatchObject({
      recommendedPackType: "instance",
      workflow: {
        recommendedExportCommand: "harness export -p /tmp/openclaw -t instance -o my-agent.harness",
        overrideExportCommand: "harness export -p /tmp/openclaw -t template --allow-pack-type-override -o my-agent.harness",
      },
    });
  });

  it("sets exit code when inspect does not detect an OpenClaw instance", async () => {
    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: {
        inspect: () => ({
          detected: false,
          stateDir: "/tmp/unknown",
          recommendedPackType: "template",
          warnings: [],
        }),
      },
    }));
    vi.doMock("../src/utils/output.js", () => ({
      printInspectResult: vi.fn(),
    }));

    const { inspectCommand } = await importFresh<typeof import("../src/commands/inspect.js")>("../src/commands/inspect.js");
    await inspectCommand.parseAsync(["node", "inspect"], { from: "node" });

    expect(process.exitCode).toBe(1);
  });

  it("renders inspect errors in json mode", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: {
        inspect: () => {
          throw new Error("inspect failed");
        },
      },
    }));
    vi.doMock("../src/utils/output.js", () => ({
      printInspectResult: vi.fn(),
    }));

    const { inspectCommand } = await importFresh<typeof import("../src/commands/inspect.js")>("../src/commands/inspect.js");
    await inspectCommand.parseAsync(["node", "inspect", "-f", "json"], { from: "node" });

    expect(log).toHaveBeenCalledWith(expect.stringContaining("\"error\":\"Error: inspect failed\""));
    expect(process.exitCode).toBe(1);
  });

  it("renders inspect errors in text mode", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: {
        inspect: () => {
          throw new Error("inspect failed");
        },
      },
    }));
    vi.doMock("../src/utils/output.js", () => ({
      printInspectResult: vi.fn(),
    }));

    const { inspectCommand } = await importFresh<typeof import("../src/commands/inspect.js")>("../src/commands/inspect.js");
    await inspectCommand.parseAsync(["node", "inspect"], { from: "node" });

    expect(error).toHaveBeenCalledWith("Error: inspect failed");
    expect(process.exitCode).toBe(1);
  });

  it("renders export command JSON output including policy warnings", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({
      exportPack: vi.fn(async () => ({
        outputFile: "/tmp/out.harness",
        manifest: {
          packId: "pack-1",
          packType: "template",
          riskLevel: "internal-only",
        },
        fileCount: 12,
        totalSize: 4096,
        warnings: ["Sensitive config was excluded."],
        policyWarnings: ["Inspect recommended instance first."],
      })),
    }));

    const { exportCommand } = await importFresh<typeof import("../src/commands/export.js")>("../src/commands/export.js");
    await exportCommand.parseAsync(["node", "export", "-f", "json"], { from: "node" });

    expect(log.mock.calls[0]?.[0]).toContain("\"policyWarnings\": [");
    expect(log.mock.calls[0]?.[0]).toContain("\"outputFile\": \"/tmp/out.harness\"");
  });

  it("renders export command text output without warnings", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({
      exportPack: vi.fn(async () => ({
        outputFile: "/tmp/out.harness",
        manifest: {
          packId: "pack-10",
          packType: "instance",
          riskLevel: "trusted-migration-only",
        },
        fileCount: 3,
        totalSize: 2 * 1024 * 1024,
        warnings: [],
        policyWarnings: [],
      })),
    }));

    const { exportCommand } = await importFresh<typeof import("../src/commands/export.js")>("../src/commands/export.js");
    await exportCommand.parseAsync(["node", "export"], { from: "node" });

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("=== HarnessHub Export ===");
    expect(output).toContain("Risk level:   trusted-migration-only");
    expect(output).toContain("Size:         2.0 MB");
    expect(output).not.toContain("--- Warnings ---");
  });

  it("renders export sizes in bytes and kilobytes", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({
      exportPack: vi.fn(async () => ({
        outputFile: "/tmp/out.harness",
        manifest: {
          packId: "pack-11",
          packType: "template",
          riskLevel: "safe-share",
        },
        fileCount: 1,
        totalSize: 900,
        warnings: ["small export"],
        policyWarnings: [],
      })),
    }));

    const { exportCommand } = await importFresh<typeof import("../src/commands/export.js")>("../src/commands/export.js");
    await exportCommand.parseAsync(["node", "export"], { from: "node" });
    expect(log.mock.calls.flat().join("\n")).toContain("Size:         900 B");

    vi.resetModules();
    log.mockClear();
    vi.doMock("../src/core/packer.js", () => ({
      exportPack: vi.fn(async () => ({
        outputFile: "/tmp/out.harness",
        manifest: {
          packId: "pack-12",
          packType: "template",
          riskLevel: "safe-share",
        },
        fileCount: 1,
        totalSize: 1536,
        warnings: [],
        policyWarnings: [],
      })),
    }));

    const { exportCommand: exportCommandKb } = await importFresh<typeof import("../src/commands/export.js")>("../src/commands/export.js");
    await exportCommandKb.parseAsync(["node", "export"], { from: "node" });
    expect(log.mock.calls.flat().join("\n")).toContain("Size:         1.5 KB");
  });

  it("rejects an invalid export pack type before calling the packer", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const exportPack = vi.fn();

    vi.doMock("../src/core/packer.js", () => ({ exportPack }));

    const { exportCommand } = await importFresh<typeof import("../src/commands/export.js")>("../src/commands/export.js");
    await exportCommand.parseAsync(["node", "export", "-t", "broken"], { from: "node" });

    expect(exportPack).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledWith(expect.stringContaining("Invalid pack type"));
    expect(process.exitCode).toBe(1);
  });

  it("renders invalid export pack type errors in json mode", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({ exportPack: vi.fn() }));

    const { exportCommand } = await importFresh<typeof import("../src/commands/export.js")>("../src/commands/export.js");
    await exportCommand.parseAsync(["node", "export", "-t", "broken", "-f", "json"], { from: "node" });

    expect(log).toHaveBeenCalledWith(expect.stringContaining("\"error\":\"Invalid pack type: broken. Must be \\\"template\\\" or \\\"instance\\\".\""));
    expect(process.exitCode).toBe(1);
  });

  it("renders export command failures in text mode", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({
      exportPack: vi.fn(async () => {
        throw new Error("export failed");
      }),
    }));

    const { exportCommand } = await importFresh<typeof import("../src/commands/export.js")>("../src/commands/export.js");
    await exportCommand.parseAsync(["node", "export"], { from: "node" });

    expect(error).toHaveBeenCalledWith("Error: export failed");
    expect(process.exitCode).toBe(1);
  });

  it("renders import warnings in text mode", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({
      importPack: vi.fn(async () => ({
        targetDir: "/tmp/imported",
        manifest: {
          packId: "pack-2",
          packType: "instance",
          riskLevel: "trusted-migration-only",
        },
        fileCount: 33,
        warnings: ["Rebound workspace paths in openclaw.json."],
      })),
    }));

    const { importCommand } = await importFresh<typeof import("../src/commands/import.js")>("../src/commands/import.js");
    await importCommand.parseAsync(["node", "import", "artifact.harness"], { from: "node" });

    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("=== HarnessHub Import ===");
    expect(output).toContain("! Rebound workspace paths in openclaw.json.");
    expect(output).toContain("Import complete. Run `harness verify` to check the result.");
  });

  it("renders import command JSON output", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({
      importPack: vi.fn(async () => ({
        targetDir: "/tmp/imported",
        manifest: {
          packId: "pack-20",
          packType: "template",
          riskLevel: "safe-share",
        },
        fileCount: 2,
        warnings: [],
      })),
    }));

    const { importCommand } = await importFresh<typeof import("../src/commands/import.js")>("../src/commands/import.js");
    await importCommand.parseAsync(["node", "import", "artifact.harness", "-f", "json"], { from: "node" });

    expect(log).toHaveBeenCalledWith(expect.stringContaining("\"packId\": \"pack-20\""));
  });

  it("renders import command failures in json mode", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({
      importPack: vi.fn(async () => {
        throw new Error("import failed");
      }),
    }));

    const { importCommand } = await importFresh<typeof import("../src/commands/import.js")>("../src/commands/import.js");
    await importCommand.parseAsync(["node", "import", "artifact.harness", "-f", "json"], { from: "node" });

    expect(log).toHaveBeenCalledWith(expect.stringContaining("\"error\":\"Error: import failed\""));
    expect(process.exitCode).toBe(1);
  });

  it("renders import command failures in text mode", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.doMock("../src/core/packer.js", () => ({
      importPack: vi.fn(async () => {
        throw new Error("import failed");
      }),
    }));

    const { importCommand } = await importFresh<typeof import("../src/commands/import.js")>("../src/commands/import.js");
    await importCommand.parseAsync(["node", "import", "artifact.harness"], { from: "node" });

    expect(error).toHaveBeenCalledWith("Error: import failed");
    expect(process.exitCode).toBe(1);
  });

  it("renders verify results in text mode after loading the persisted manifest", async () => {
    vi.doMock("node:fs", () => ({
      default: {
        existsSync: vi.fn((candidate: string) => candidate.endsWith(".harness-manifest.json")),
        readFileSync: vi.fn(() => JSON.stringify({ packId: "pack-3" })),
      },
    }));

    const verify = vi.fn(() => ({
      valid: true,
      readinessClass: "runtime_ready",
      runtimeReady: true,
      readinessSummary: "Ready to run.",
      checks: [],
      warnings: [],
      runtimeReadinessIssues: [],
      remediationSteps: [],
      errors: [],
    }));
    const printVerifyResult = vi.fn();
    const resolveStateDir = vi.fn(() => "/tmp/openclaw");

    vi.doMock("../src/core/verifier.js", () => ({ verify }));
    vi.doMock("../src/utils/output.js", () => ({ printVerifyResult }));
    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: { resolveStateDir },
    }));

    const { verifyCommand } = await importFresh<typeof import("../src/commands/verify.js")>("../src/commands/verify.js");
    await verifyCommand.parseAsync(["node", "verify"], { from: "node" });

    expect(resolveStateDir).toHaveBeenCalled();
    expect(verify).toHaveBeenCalledWith("/tmp/openclaw", { packId: "pack-3" });
    expect(printVerifyResult).toHaveBeenCalledWith(expect.objectContaining({
      readinessClass: "runtime_ready",
    }), "text");
  });

  it("sets exit code when verify returns an invalid result without a manifest", async () => {
    const existsSync = vi.fn(() => false);
    const readFileSync = vi.fn();
    const verify = vi.fn(() => ({
      valid: false,
      readinessClass: "manual_steps_required",
      runtimeReady: false,
      readinessSummary: "Repair required.",
      checks: [],
      warnings: [],
      runtimeReadinessIssues: [],
      remediationSteps: [],
      errors: [],
    }));
    const printVerifyResult = vi.fn();

    vi.doMock("node:fs", () => ({
      default: { existsSync, readFileSync },
    }));
    vi.doMock("../src/core/verifier.js", () => ({ verify }));
    vi.doMock("../src/utils/output.js", () => ({ printVerifyResult }));
    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: { resolveStateDir: () => "/tmp/openclaw" },
    }));

    const { verifyCommand } = await importFresh<typeof import("../src/commands/verify.js")>("../src/commands/verify.js");
    await verifyCommand.parseAsync(["node", "verify"], { from: "node" });

    expect(existsSync).toHaveBeenCalledTimes(2);
    expect(readFileSync).not.toHaveBeenCalled();
    expect(verify).toHaveBeenCalledWith("/tmp/openclaw", undefined);
    expect(process.exitCode).toBe(1);
    expect(printVerifyResult).toHaveBeenCalledWith(expect.objectContaining({
      readinessClass: "manual_steps_required",
    }), "text");
  });

  it("prefers manifest.json over the persisted fallback file", async () => {
    const existsSync = vi.fn((candidate: string) => candidate.endsWith("manifest.json"));
    const readFileSync = vi.fn(() => JSON.stringify({ packId: "manifest-pack" }));
    const verify = vi.fn(() => ({
      valid: true,
      readinessClass: "runtime_ready",
      runtimeReady: true,
      readinessSummary: "Ready to run.",
      checks: [],
      warnings: [],
      runtimeReadinessIssues: [],
      remediationSteps: [],
      errors: [],
    }));

    vi.doMock("node:fs", () => ({
      default: { existsSync, readFileSync },
    }));
    vi.doMock("../src/core/verifier.js", () => ({ verify }));
    vi.doMock("../src/utils/output.js", () => ({ printVerifyResult: vi.fn() }));
    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: { resolveStateDir: () => "/tmp/openclaw" },
    }));

    const { verifyCommand } = await importFresh<typeof import("../src/commands/verify.js")>("../src/commands/verify.js");
    await verifyCommand.parseAsync(["node", "verify"], { from: "node" });

    expect(readFileSync).toHaveBeenCalledOnce();
    expect(verify).toHaveBeenCalledWith("/tmp/openclaw", { packId: "manifest-pack" });
  });

  it("verifies an explicit target path and falls back to the hidden manifest file", async () => {
    const existsSync = vi.fn((candidate: string) => candidate.endsWith(".harness-manifest.json"));
    const readFileSync = vi.fn(() => JSON.stringify({ packId: "hidden-pack" }));
    const verify = vi.fn(() => ({
      valid: true,
      readinessClass: "runtime_ready",
      runtimeReady: true,
      readinessSummary: "Ready to run.",
      checks: [],
      warnings: [],
      runtimeReadinessIssues: [],
      remediationSteps: [],
      errors: [],
    }));
    const printVerifyResult = vi.fn();
    const resolveStateDir = vi.fn(() => "/tmp/should-not-be-used");

    vi.doMock("node:fs", () => ({
      default: { existsSync, readFileSync },
    }));
    vi.doMock("../src/core/verifier.js", () => ({ verify }));
    vi.doMock("../src/utils/output.js", () => ({ printVerifyResult }));
    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: { resolveStateDir },
    }));

    const { verifyCommand } = await importFresh<typeof import("../src/commands/verify.js")>("../src/commands/verify.js");
    await verifyCommand.parseAsync(["node", "verify", "--path", "./fixture-state"], { from: "node" });

    expect(resolveStateDir).not.toHaveBeenCalled();
    expect(verify).toHaveBeenCalledWith(expect.stringMatching(/fixture-state$/), { packId: "hidden-pack" });
    expect(printVerifyResult).toHaveBeenCalledWith(expect.objectContaining({
      readinessClass: "runtime_ready",
    }), "text");
  });

  it("renders verify command failures in json mode", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    vi.doMock("../src/core/verifier.js", () => ({
      verify: vi.fn(() => {
        throw new Error("verify failed");
      }),
    }));
    vi.doMock("../src/utils/output.js", () => ({
      printVerifyResult: vi.fn(),
    }));
    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: { resolveStateDir: () => "/tmp/openclaw" },
    }));

    const { verifyCommand } = await importFresh<typeof import("../src/commands/verify.js")>("../src/commands/verify.js");
    await verifyCommand.parseAsync(["node", "verify", "-f", "json"], { from: "node" });

    expect(log).toHaveBeenCalledWith(expect.stringContaining("\"error\":\"Error: verify failed\""));
    expect(process.exitCode).toBe(1);
  });

  it("renders verify command failures in text mode", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.doMock("../src/core/verifier.js", () => ({
      verify: vi.fn(() => {
        throw new Error("verify failed");
      }),
    }));
    vi.doMock("../src/utils/output.js", () => ({
      printVerifyResult: vi.fn(),
    }));
    vi.doMock("../src/core/adapters/openclaw.js", () => ({
      openClawAdapter: { resolveStateDir: () => "/tmp/openclaw" },
    }));

    const { verifyCommand } = await importFresh<typeof import("../src/commands/verify.js")>("../src/commands/verify.js");
    await verifyCommand.parseAsync(["node", "verify"], { from: "node" });

    expect(error).toHaveBeenCalledWith("Error: verify failed");
    expect(process.exitCode).toBe(1);
  });

  it("creates a CLI program with the expected commands and metadata", async () => {
    const { createProgram } = await importFresh<typeof import("../src/cli.js")>("../src/cli.js");
    const program = createProgram();

    expect(program.name()).toBe("harness");
    expect(program.description()).toContain("HarnessHub CLI");
    expect(program.commands.map(command => command.name())).toEqual(["inspect", "export", "import", "verify"]);
  });

  it("dispatches the CLI through parseAsync without mutating process.argv", async () => {
    const parseAsync = vi.spyOn(Command.prototype, "parseAsync").mockResolvedValue(new Command());

    const { run } = await importFresh<typeof import("../src/cli.js")>("../src/cli.js");
    await run(["node", "harness", "--help"]);

    expect(parseAsync).toHaveBeenCalledOnce();
    expect(parseAsync.mock.calls[0]?.[0]).toEqual(["node", "harness", "--help"]);
  });
});

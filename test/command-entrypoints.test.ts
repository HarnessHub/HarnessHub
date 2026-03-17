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

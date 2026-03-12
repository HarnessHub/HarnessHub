import { Command } from "commander";
import path from "node:path";
import { openClawAdapter } from "../core/adapters/openclaw.js";
import { printInspectResult } from "../utils/output.js";
import type { InspectResult, OutputFormat } from "../core/types.js";

export const inspectCommand = new Command("inspect")
  .description("Inspect an OpenClaw instance and report its structure and risks")
  .option("-p, --path <path>", "Path to OpenClaw state directory")
  .option("-f, --format <format>", "Output format: text or json", "text")
  .action((opts) => {
    const format = opts.format as OutputFormat;
    try {
      const result = withWorkflowGuidance(openClawAdapter.inspect(opts.path));
      printInspectResult(result as unknown as Record<string, unknown>, format);
      if (!result.detected) {
        process.exitCode = 1;
      }
    } catch (err) {
      if (format === "json") {
        console.log(JSON.stringify({ error: String(err) }));
      } else {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
      }
      process.exitCode = 1;
    }
  });

function withWorkflowGuidance(result: InspectResult): InspectResult {
  const sourcePath = path.resolve(result.stateDir);
  const baseCommand = `harness export -p ${sourcePath} -t ${result.recommendedPackType} -o my-agent.harness`;

  if (result.recommendedPackType === "instance") {
    return {
      ...result,
      workflow: {
        recommendedExportCommand: baseCommand,
        recommendationSummary: "Inspect recommends an instance export for migration-oriented use because sensitive or runtime state was detected.",
        overrideExportCommand: `harness export -p ${sourcePath} -t template --allow-pack-type-override -o my-agent.harness`,
      },
    };
  }

  return {
    ...result,
    workflow: {
      recommendedExportCommand: baseCommand,
      recommendationSummary: "Inspect recommends a template export for share-oriented use because the source qualifies for the template contract.",
      overrideExportCommand: `harness export -p ${sourcePath} -t instance -o my-agent.harness`,
    },
  };
}

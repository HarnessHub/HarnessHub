import { Command } from "commander";
import { composeHarness, formatComposeResult } from "../core/compose.js";
import type { OutputFormat } from "../core/types.js";

export const composeCommand = new Command("compose")
  .description("Compose one local child harness on top of a local parent materialization")
  .option("-p, --path <path>", "Path to the child OpenClaw state directory")
  .option("-d, --definition <path>", "Definition file path")
  .option("-o, --output <path>", "Output directory for the composed materialization")
  .option("--force", "Overwrite an existing non-empty compose output directory")
  .option("-f, --format <format>", "Output format: text or json", "text")
  .action((opts) => {
    const format = opts.format as OutputFormat;

    try {
      const result = composeHarness({
        cwd: process.cwd(),
        definitionPath: opts.definition,
        sourcePath: opts.path,
        outputPath: opts.output,
        force: Boolean(opts.force),
      });
      console.log(formatComposeResult(result, format));
    } catch (err) {
      if (format === "json") {
        console.log(JSON.stringify({ error: String(err) }));
      } else {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
      }
      process.exitCode = 1;
    }
  });

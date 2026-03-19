import { Command } from "commander";
import {
  formatInitDefinitionResult,
  initHarnessDefinition,
} from "../core/definition.js";
import type { OutputFormat } from "../core/types.js";

export const initCommand = new Command("init")
  .description("Create a repository-local HarnessHub definition file")
  .option("-p, --path <path>", "Bootstrap the definition from an OpenClaw source path")
  .option("-o, --output <path>", "Definition file path")
  .option("--image-id <imageId>", "Explicit image id for the definition")
  .option("--parent-image-id <imageId>", "Declare a local parent image by image id")
  .option("--parent-path <path>", "Declare a local parent image by local definition or manifest path")
  .option("--force", "Overwrite an existing definition file")
  .option("-f, --format <format>", "Output format: text or json", "text")
  .action((opts) => {
    const format = opts.format as OutputFormat;

    try {
      const result = initHarnessDefinition({
        cwd: process.cwd(),
        outputPath: opts.output,
        sourcePath: opts.path,
        imageId: opts.imageId,
        parentImageId: opts.parentImageId,
        parentPath: opts.parentPath,
        force: Boolean(opts.force),
      });
      console.log(formatInitDefinitionResult(result, format));
    } catch (err) {
      if (format === "json") {
        console.log(JSON.stringify({ error: String(err) }));
      } else {
        console.error(`Error: ${err instanceof Error ? err.message : err}`);
      }
      process.exitCode = 1;
    }
  });

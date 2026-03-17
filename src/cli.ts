#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { inspectCommand } from "./commands/inspect.js";
import { exportCommand } from "./commands/export.js";
import { importCommand } from "./commands/import.js";
import { verifyCommand } from "./commands/verify.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("harness")
    .description("HarnessHub CLI for packaging OpenClaw-style agent runtimes")
    .version("0.1.0");

  program.addCommand(inspectCommand);
  program.addCommand(exportCommand);
  program.addCommand(importCommand);
  program.addCommand(verifyCommand);

  return program;
}

export async function run(argv = process.argv): Promise<void> {
  await createProgram().parseAsync(argv);
}

const isDirectExecution = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  void run();
}

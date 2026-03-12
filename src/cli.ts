#!/usr/bin/env node

import { Command } from "commander";
import { inspectCommand } from "./commands/inspect.js";
import { exportCommand } from "./commands/export.js";
import { importCommand } from "./commands/import.js";
import { verifyCommand } from "./commands/verify.js";

const program = new Command();

program
  .name("harness")
  .description("HarnessHub CLI for packaging OpenClaw-style agent runtimes")
  .version("0.1.0");

program.addCommand(inspectCommand);
program.addCommand(exportCommand);
program.addCommand(importCommand);
program.addCommand(verifyCommand);

program.parse();

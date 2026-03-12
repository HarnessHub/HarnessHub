import fs from "node:fs";
import JSON5 from "json5";
import type { Manifest } from "../types.js";
import {
  findConfigFile,
  inspect,
  resolveStateDir,
  resolveWorkspaceBindings,
} from "../scanner.js";
import type { HarnessAdapter } from "./types.js";

function rebindImportedConfig(targetDir: string, manifest: Manifest, warnings: string[]) {
  const configPath = findConfigFile(targetDir);
  const workspaceBindings = manifest.bindings?.workspaces ?? [];
  if (!configPath || workspaceBindings.length === 0) return;

  let parsed: any;
  try {
    parsed = JSON5.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    warnings.push(`Could not parse config for workspace rebinding: ${configPath.split("/").pop()}`);
    return;
  }

  if (!parsed || typeof parsed !== "object") return;

  if (!parsed.agents || typeof parsed.agents !== "object") {
    parsed.agents = {};
  }
  if (!parsed.agents.defaults || typeof parsed.agents.defaults !== "object") {
    parsed.agents.defaults = {};
  }
  if (!Array.isArray(parsed.agents.list)) {
    parsed.agents.list = [];
  }

  let changed = false;

  for (const workspace of workspaceBindings) {
    const targetWorkspacePath = `${targetDir}/${workspace.targetRelativePath}`;
    const isDefault = workspace.targetRelativePath === "workspace";

    if (isDefault && parsed.agents.defaults.workspace !== targetWorkspacePath) {
      parsed.agents.defaults.workspace = targetWorkspacePath;
      changed = true;
    }

    const agentEntry = parsed.agents.list.find((entry: any) => {
      const id = typeof entry?.id === "string" ? entry.id.trim().toLowerCase() : "";
      return id === workspace.agentId;
    });
    if (agentEntry && agentEntry.workspace !== targetWorkspacePath) {
      agentEntry.workspace = targetWorkspacePath;
      changed = true;
    }
  }

  if (!changed) return;

  fs.writeFileSync(configPath, `${JSON.stringify(parsed, null, 2)}\n`);
  warnings.push(
    `Rebound workspace paths in ${configPath.split("/").pop()} to ${targetDir}; JSON5 formatting/comments were normalized.`
  );
}

export const openClawAdapter: HarnessAdapter = {
  id: "openclaw",
  resolveStateDir,
  findConfigFile,
  resolveWorkspaceBindings,
  inspect,
  rebindImportedConfig,
};

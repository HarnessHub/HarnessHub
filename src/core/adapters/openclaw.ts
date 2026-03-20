import type { Manifest } from "../types.js";
import {
  findConfigFile,
  inspect,
  resolveStateDir,
  resolveWorkspaceBindings,
} from "../scanner.js";
import { rebindWorkspaceTargets } from "../materialization.js";
import type { HarnessAdapter } from "./types.js";

function rebindImportedConfig(targetDir: string, manifest: Manifest, warnings: string[]) {
  const configPath = findConfigFile(targetDir);
  warnings.push(...rebindWorkspaceTargets({
    targetDir,
    configPath,
    bindings: manifest.bindings?.workspaces ?? [],
    mutableTargets: manifest.rebinding?.mutableConfigTargets ?? [],
  }));
}

export const openClawAdapter: HarnessAdapter = {
  id: "openclaw",
  resolveStateDir,
  findConfigFile,
  resolveWorkspaceBindings,
  inspect,
  rebindImportedConfig,
};

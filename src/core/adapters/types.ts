import type { InspectResult, Manifest } from "../types.js";
import type { ResolvedWorkspaceBinding } from "../scanner.js";

export interface HarnessAdapter {
  readonly id: string;
  resolveStateDir(customPath?: string): string;
  findConfigFile(stateDir: string): string | null;
  resolveWorkspaceBindings(stateDir: string, configPath: string | null): ResolvedWorkspaceBinding[];
  inspect(customPath?: string): InspectResult;
  rebindImportedConfig(targetDir: string, manifest: Manifest, warnings: string[]): void;
}

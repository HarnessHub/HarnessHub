import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";
import type { BindingSemantics, Manifest } from "./types.js";

export function copyDirRecursive(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function restoreImportedMaterialization(tempDir: string, targetDir: string, manifest: Manifest) {
  const wsSource = path.join(tempDir, manifest.placement.componentRoots.workspace);
  if (fs.existsSync(wsSource)) {
    copyDirRecursive(wsSource, path.join(targetDir, manifest.placement.componentRoots.workspace));
  }

  const workspacesSource = path.join(tempDir, manifest.placement.componentRoots.workspaces);
  if (fs.existsSync(workspacesSource)) {
    restoreAgentWorkspaces(workspacesSource, targetDir);
  }

  const configSource = path.join(tempDir, manifest.placement.componentRoots.config);
  if (fs.existsSync(configSource)) {
    restoreConfigDir(configSource, targetDir);
  }

  const stateSource = path.join(tempDir, manifest.placement.componentRoots.state);
  if (fs.existsSync(stateSource)) {
    restoreStateDir(stateSource, targetDir);
  }
}

export function rebindWorkspaceTargets(params: {
  targetDir: string;
  configPath: string | null;
  bindings: BindingSemantics["workspaces"];
  mutableTargets?: readonly string[];
}): string[] {
  const { targetDir, configPath, bindings, mutableTargets } = params;
  if (!configPath || bindings.length === 0) return [];

  let parsed: any;
  try {
    parsed = JSON5.parse(fs.readFileSync(configPath, "utf-8"));
  } catch {
    return [`Could not parse config for workspace rebinding: ${path.basename(configPath)}`];
  }

  if (!parsed || typeof parsed !== "object") return [];

  if (!parsed.agents || typeof parsed.agents !== "object") {
    parsed.agents = {};
  }
  if (!parsed.agents.defaults || typeof parsed.agents.defaults !== "object") {
    parsed.agents.defaults = {};
  }
  if (!Array.isArray(parsed.agents.list)) {
    parsed.agents.list = [];
  }

  const allowedTargets = new Set(mutableTargets ?? bindings.flatMap((binding) => binding.configTargets));
  let changed = false;

  for (const binding of bindings) {
    const targetWorkspacePath = path.join(targetDir, binding.targetRelativePath);

    if (
      binding.targetRelativePath === "workspace"
      && allowedTargets.has("agents.defaults.workspace")
      && parsed.agents.defaults.workspace !== targetWorkspacePath
    ) {
      parsed.agents.defaults.workspace = targetWorkspacePath;
      changed = true;
    }

    const agentEntry = parsed.agents.list.find((entry: any) => {
      const id = typeof entry?.id === "string" ? entry.id.trim().toLowerCase() : "";
      return id === binding.agentId;
    });
    if (!agentEntry) continue;

    const agentTarget = `agents.list[${binding.agentId}].workspace`;
    if (allowedTargets.has(agentTarget) && agentEntry.workspace !== targetWorkspacePath) {
      agentEntry.workspace = targetWorkspacePath;
      changed = true;
    }
  }

  if (!changed) return [];

  fs.writeFileSync(configPath, `${JSON.stringify(parsed, null, 2)}\n`);
  return [
    `Rebound workspace paths in ${path.basename(configPath)} to ${targetDir}; JSON5 formatting/comments were normalized.`,
  ];
}

function restoreAgentWorkspaces(workspacesSource: string, targetDir: string) {
  const entries = fs.readdirSync(workspacesSource, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    copyDirRecursive(
      path.join(workspacesSource, entry.name),
      path.join(targetDir, `workspace-${entry.name}`)
    );
  }
}

function restoreConfigDir(configSource: string, targetDir: string) {
  const entries = fs.readdirSync(configSource, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(configSource, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(src, path.join(targetDir, entry.name));
    } else {
      fs.copyFileSync(src, path.join(targetDir, entry.name));
    }
  }
}

function restoreStateDir(stateSource: string, targetDir: string) {
  const entries = fs.readdirSync(stateSource, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(stateSource, entry.name);
    const dest = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(src, dest);
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }
}

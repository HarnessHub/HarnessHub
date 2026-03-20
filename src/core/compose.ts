import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";
import { openClawAdapter } from "./adapters/openclaw.js";
import { readHarnessDefinition, validateOperationalDefinitionLineage } from "./definition.js";
import {
  HARNESS_DEFINITION_FILE,
  HARNESS_DEFINITION_SCHEMA_VERSION,
  type HarnessDefinition,
  type OutputFormat,
  type WorkspaceBinding,
} from "./types.js";

const ROOT_CONFIG_DIRS = new Set(["hooks", "extensions", "completions"]);
const PASSTHROUGH_EXCLUDES = new Set([
  ".git",
  "node_modules",
  ".harness-staging",
  HARNESS_DEFINITION_FILE,
  ".harness-manifest.json",
]);

type ComposeEntryMode = "override" | "passthrough";

interface ComposeEntry {
  sourcePath: string;
  outputRelativePath: string;
  mode: ComposeEntryMode;
}

interface ComposeSource {
  entries: ComposeEntry[];
  passthroughRoots: Set<string>;
  workspaceBindings: WorkspaceBinding[];
}

export interface ComposeOptions {
  cwd?: string;
  definitionPath?: string;
  sourcePath?: string;
  outputPath?: string;
  force?: boolean;
}

export interface ComposeResult {
  definitionFile: string;
  parentDir: string;
  childDir: string;
  targetDir: string;
  imageId: string;
  parentImageId: string;
  overwrittenRoots: string[];
  passthroughRoots: string[];
  warnings: string[];
}

export function composeHarness(options: ComposeOptions): ComposeResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const definitionFile = path.resolve(cwd, options.definitionPath ?? HARNESS_DEFINITION_FILE);
  if (!fs.existsSync(definitionFile)) {
    throw new Error(`Definition file not found: ${definitionFile}`);
  }

  const definition = readHarnessDefinition(definitionFile);
  const lineageErrors = validateOperationalDefinitionLineage(definition, definitionFile);
  if (lineageErrors.length > 0) {
    throw new Error(`Definition lineage validation failed: ${lineageErrors.join("; ")}`);
  }
  if (definition.lineage.parentImage === null) {
    throw new Error("Local compose requires lineage.parentImage to be set.");
  }
  if (definition.lineage.parentImage.refType !== "path") {
    throw new Error("Local compose requires lineage.parentImage.refType to be \"path\".");
  }

  const parentDir = resolveComposeSourceDir(
    path.resolve(path.dirname(definitionFile), definition.lineage.parentImage.value),
    "parent"
  );
  const childDir = openClawAdapter.resolveStateDir(options.sourcePath);
  const targetDir = path.resolve(cwd, options.outputPath ?? path.join(".harness-compose", definition.image.imageId));

  ensureSafeOutputPath(targetDir, parentDir, childDir);
  prepareOutputDirectory(targetDir, Boolean(options.force));

  const parent = collectComposeSource(parentDir);
  const child = collectComposeSource(childDir);
  const passthroughConflicts = intersectSets(parent.passthroughRoots, child.passthroughRoots);
  if (passthroughConflicts.length > 0) {
    throw new Error(
      `Unsupported component overlap during compose: ${passthroughConflicts.join(", ")}. ` +
      "0.2.0 compose only overrides config/workspace roots and fails on overlapping passthrough roots."
    );
  }

  copyEntries(parent.entries, targetDir);
  copyEntries(child.entries, targetDir);
  const warnings = rebindComposedConfig(targetDir, child.workspaceBindings);
  writeComposedDefinitionSnapshot(targetDir, definition, resolveParentImageId(definition, parentDir));

  return {
    definitionFile,
    parentDir,
    childDir,
    targetDir,
    imageId: definition.image.imageId,
    parentImageId: resolveParentImageId(definition, parentDir),
    overwrittenRoots: ["config", "workspace", "skills"],
    passthroughRoots: [...new Set([...parent.passthroughRoots, ...child.passthroughRoots])].sort(),
    warnings,
  };
}

export function formatComposeResult(result: ComposeResult, format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({
      success: true,
      definitionFile: result.definitionFile,
      parentDir: result.parentDir,
      childDir: result.childDir,
      targetDir: result.targetDir,
      imageId: result.imageId,
      parentImageId: result.parentImageId,
      overwrittenRoots: result.overwrittenRoots,
      passthroughRoots: result.passthroughRoots,
      warnings: result.warnings,
    }, null, 2);
  }

  return [
    "",
    "=== HarnessHub Compose ===",
    "",
    `  Definition:   ${result.definitionFile}`,
    `  Parent:       ${result.parentDir}`,
    `  Child:        ${result.childDir}`,
    `  Output:       ${result.targetDir}`,
    `  Image ID:     ${result.imageId}`,
    `  Parent ID:    ${result.parentImageId}`,
    `  Overrides:    ${result.overwrittenRoots.join(", ")}`,
    `  Passthrough:  ${result.passthroughRoots.join(", ") || "(none)"}`,
    "",
    "Compose complete.",
    "",
  ].join("\n");
}

function resolveComposeSourceDir(inputPath: string, label: "parent" | "child"): string {
  const resolved = fs.existsSync(inputPath) && fs.statSync(inputPath).isFile()
    ? path.dirname(inputPath)
    : inputPath;

  const inspection = openClawAdapter.inspect(resolved);
  if (!inspection.detected) {
    throw new Error(`Could not detect an OpenClaw-style ${label} materialization at ${resolved}.`);
  }
  return resolved;
}

function ensureSafeOutputPath(targetDir: string, parentDir: string, childDir: string) {
  if (isNestedPath(parentDir, targetDir) || isNestedPath(childDir, targetDir)) {
    throw new Error("Compose output path must not be inside the parent or child source directory.");
  }
  if (isNestedPath(targetDir, parentDir) || isNestedPath(targetDir, childDir)) {
    throw new Error("Compose output path must not contain the parent or child source directory.");
  }
}

function isNestedPath(baseDir: string, candidate: string): boolean {
  const relative = path.relative(baseDir, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function prepareOutputDirectory(targetDir: string, force: boolean) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
    return;
  }

  const entries = fs.readdirSync(targetDir);
  if (entries.length === 0) return;
  if (!force) {
    throw new Error(`Compose output directory already exists and is not empty: ${targetDir}. Use --force to overwrite it.`);
  }
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
}

function resolveParentImageId(definition: HarnessDefinition, parentDir: string): string {
  if (definition.lineage.parentImage === null) {
    throw new Error("Parent image is required for compose.");
  }
  if (definition.lineage.parentImage.refType === "image-id") {
    return definition.lineage.parentImage.value;
  }
  const parentDefinitionFile = path.join(parentDir, HARNESS_DEFINITION_FILE);
  if (fs.existsSync(parentDefinitionFile)) {
    return readHarnessDefinition(parentDefinitionFile).image.imageId;
  }
  return path.basename(parentDir);
}

function writeComposedDefinitionSnapshot(
  targetDir: string,
  definition: HarnessDefinition,
  parentImageId: string
) {
  const snapshot: HarnessDefinition = {
    ...definition,
    schemaVersion: HARNESS_DEFINITION_SCHEMA_VERSION,
    lineage: {
      parentImage: {
        refType: "image-id",
        value: parentImageId,
      },
      layerOrder: [parentImageId, definition.image.imageId],
    },
  };
  fs.writeFileSync(path.join(targetDir, HARNESS_DEFINITION_FILE), `${JSON.stringify(snapshot, null, 2)}\n`);
}

function collectComposeSource(stateDir: string): ComposeSource {
  const configPath = openClawAdapter.findConfigFile(stateDir);
  const workspaceBindings = openClawAdapter.resolveWorkspaceBindings(stateDir, configPath);
  const workspaceDirNames = new Set(
    workspaceBindings
      .filter((binding) => path.dirname(binding.sourcePath) === stateDir)
      .map((binding) => path.basename(binding.sourcePath))
  );

  const entries: ComposeEntry[] = [];
  const passthroughRoots = new Set<string>();

  for (const binding of workspaceBindings) {
    const targetRoot = binding.isDefault ? "workspace" : binding.logicalPath;
    for (const relPath of listFilesRecursive(binding.sourcePath, binding.sourcePath)) {
      entries.push({
        sourcePath: path.join(binding.sourcePath, relPath),
        outputRelativePath: path.posix.join(targetRoot, relPath.split(path.sep).join("/")),
        mode: "override",
      });
    }
  }

  if (configPath) {
    entries.push({
      sourcePath: configPath,
      outputRelativePath: path.basename(configPath),
      mode: "override",
    });
  }

  for (const rootDir of ROOT_CONFIG_DIRS) {
    const absoluteRoot = path.join(stateDir, rootDir);
    if (!fs.existsSync(absoluteRoot)) continue;
    for (const relPath of listFilesRecursive(absoluteRoot, absoluteRoot)) {
      entries.push({
        sourcePath: path.join(absoluteRoot, relPath),
        outputRelativePath: path.posix.join(rootDir, relPath.split(path.sep).join("/")),
        mode: "override",
      });
    }
  }

  for (const entry of fs.readdirSync(stateDir, { withFileTypes: true })) {
    if (PASSTHROUGH_EXCLUDES.has(entry.name)) continue;
    if (workspaceDirNames.has(entry.name)) continue;
    if (configPath && entry.name === path.basename(configPath)) continue;
    if (ROOT_CONFIG_DIRS.has(entry.name)) continue;

    const absolute = path.join(stateDir, entry.name);
    if (entry.isDirectory()) {
      for (const relPath of listFilesRecursive(absolute, absolute)) {
        entries.push({
          sourcePath: path.join(absolute, relPath),
          outputRelativePath: path.posix.join(entry.name, relPath.split(path.sep).join("/")),
          mode: "passthrough",
        });
      }
    } else {
      entries.push({
        sourcePath: absolute,
        outputRelativePath: entry.name,
        mode: "passthrough",
      });
    }
    passthroughRoots.add(normalizePassthroughRoot(entry.name));
  }

  return {
    entries,
    passthroughRoots,
    workspaceBindings: workspaceBindings.map((binding) => ({
      agentId: binding.agentId,
      logicalPath: binding.logicalPath,
      packPath: binding.packPath,
      isDefault: binding.isDefault,
    })),
  };
}

function normalizePassthroughRoot(entryName: string): string {
  if (entryName.startsWith("sessions-") && (entryName.endsWith(".json") || entryName.endsWith(".json5"))) {
    return "sessions";
  }
  if (entryName.endsWith(".db") || entryName.endsWith(".sqlite") || entryName.endsWith(".lance")) {
    return "memory";
  }
  return entryName;
}

function listFilesRecursive(dir: string, relativeTo: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, fullPath);
    if (entry.isFile()) {
      results.push(relPath);
      continue;
    }
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath, relativeTo));
    }
  }
  return results;
}

function copyEntries(entries: ComposeEntry[], targetDir: string) {
  for (const entry of entries) {
    const outputPath = path.join(targetDir, entry.outputRelativePath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.copyFileSync(entry.sourcePath, outputPath);
  }
}

function intersectSets(left: Set<string>, right: Set<string>): string[] {
  return [...left].filter((value) => right.has(value)).sort();
}

function rebindComposedConfig(targetDir: string, workspaceBindings: readonly WorkspaceBinding[]): string[] {
  const configPath = openClawAdapter.findConfigFile(targetDir);
  if (!configPath || workspaceBindings.length === 0) return [];

  let parsed: any;
  try {
    parsed = JSON5.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    return [`Could not parse config for workspace rebinding: ${path.basename(configPath)}`];
  }

  if (!parsed || typeof parsed !== "object") {
    return [];
  }

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
    const targetWorkspacePath = path.join(targetDir, workspace.isDefault ? "workspace" : workspace.logicalPath);
    if (workspace.isDefault && parsed.agents.defaults.workspace !== targetWorkspacePath) {
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

  if (!changed) return [];

  fs.writeFileSync(configPath, `${JSON.stringify(parsed, null, 2)}\n`);
  return [
    `Rebound workspace paths in ${path.basename(configPath)} to ${targetDir}; JSON5 formatting/comments were normalized.`,
  ];
}

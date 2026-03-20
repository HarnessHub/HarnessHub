import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as tar from "tar";
import JSON5 from "json5";
import type {
  HarnessComponent,
  HarnessImageLineage,
  HarnessMetadata,
  Manifest,
  PackType,
  RiskLevel,
  SensitiveFlags,
  WorkspaceBinding,
} from "./types.js";
import { SCHEMA_VERSION } from "./types.js";
import { openClawAdapter } from "./adapters/openclaw.js";
import {
  createBindingSemantics,
  DEFAULT_COMPONENT_ROOTS,
  createImageMetadata,
  createInitialLineage,
  createPlacementContract,
  createRebindingContract,
  createResolvedLineage,
} from "./builder.js";
import {
  readHarnessDefinition,
  readHarnessDefinitionIfPresent,
  resolveDefinitionParentImage,
  validateOperationalDefinitionLineage,
} from "./definition.js";
import { copyDirRecursive, restoreImportedMaterialization } from "./materialization.js";
import { assertValidManifest } from "./manifest.js";
import { isForbiddenInPackType, validatePackTypeComponents } from "./pack-contract.js";

// Files/dirs to exclude from template packs (security-critical)
const TEMPLATE_EXCLUDES = [
  // Credentials
  "credentials",
  "auth-profiles.json",
  "auth.json",
  "oauth.json",
  "creds.json",
  "creds.json.bak",
  "github-copilot.token.json",
  ".env",
  // Sessions and transcripts
  "sessions.json",
  "*.jsonl",
  "*.jsonl.lock",
  // Databases
  "*.db",
  "*.sqlite",
  "*.lance",
  // Memory and QMD
  "qmd",
  // Cron run logs (jobs.json config is ok, run history is not)
  "runs",
  // Lock files
  "*.lock",
];

// Files/dirs to always exclude
const ALWAYS_EXCLUDE = [
  "*.log",
  ".git",
  "node_modules",
  ".harness-staging",
  ".harness-import-*",
  // Backup rotation files (not needed for packaging)
  "*.bak",
  "*.bak.*",
];

function generatePackId(): string {
  return crypto.randomUUID();
}

function assessRisk(sensitive: SensitiveFlags, packType: PackType): RiskLevel {
  if (packType === "instance") {
    if (sensitive.hasCredentials || sensitive.hasOAuthTokens ||
        sensitive.hasApiKeys || sensitive.hasAuthProfiles ||
        sensitive.hasWhatsAppCreds || sensitive.hasCopilotToken) {
      return "trusted-migration-only";
    }
    return "internal-only";
  }
  if (sensitive.hasApiKeys || sensitive.hasCredentials || sensitive.hasAuthProfiles) {
    return "internal-only";
  }
  return "safe-share";
}

function shouldExclude(relativePath: string, packType: PackType): boolean {
  const basename = path.basename(relativePath);
  const parts = relativePath.split(path.sep);

  for (const pattern of ALWAYS_EXCLUDE) {
    if (matchGlob(basename, pattern)) return true;
    // Also check directory names in the path
    if (parts.some(p => matchGlob(p, pattern))) return true;
  }

  if (packType === "template") {
    for (const pattern of TEMPLATE_EXCLUDES) {
      if (matchGlob(basename, pattern)) return true;
      // Check if any directory component matches (e.g. "credentials" dir)
      if (parts.some(p => matchGlob(p, pattern))) return true;
    }
  }

  return false;
}

function matchGlob(str: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"
  );
  return regex.test(str);
}

function collectFiles(
  dir: string,
  relativeTo: string,
  packType: PackType,
  skipTopLevelDirs: ReadonlySet<string> = new Set()
): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(relativeTo, fullPath);

      if (
        currentDir === dir &&
        entry.isDirectory() &&
        skipTopLevelDirs.has(entry.name)
      ) {
        continue;
      }

      if (isForbiddenInPackType(relPath.split(path.sep).join("/"), packType)) continue;
      if (shouldExclude(relPath, packType)) continue;

      if (entry.isFile()) {
        results.push(relPath);
      } else if (entry.isDirectory()) {
        walk(fullPath);
      }
    }
  }

  walk(dir);
  return results;
}

/** Determine pack subdirectory for a given source-relative path */
function classifyPath(relPath: string): string {
  const roots = DEFAULT_COMPONENT_ROOTS;
  const parts = relPath.split(path.sep);

  // workspace/ → workspace/
  if (parts[0] === "workspace") return relPath;

  // agents/<id>/agent/auth-profiles.json, models.json → state/ (instance) or skip
  // agents/<id>/sessions/ → state/
  // agents/ subtree preserves structure under state/
  if (parts[0] === "agents") return path.join(roots.state, relPath);

  // credentials/ → state/
  if (parts[0] === "credentials") return path.join(roots.state, relPath);

  // cron/ → state/
  if (parts[0] === "cron") return path.join(roots.state, relPath);

  // memory/ → state/
  if (parts[0] === "memory") return path.join(roots.state, relPath);

  // hooks/, extensions/, skills/ → config/
  if (parts[0] === "hooks" || parts[0] === "extensions" || parts[0] === "skills") {
    return path.join(roots.config, relPath);
  }

  // completions/ → config/
  if (parts[0] === "completions") return path.join(roots.config, relPath);

  // Config files at root level
  const configExts = [".json", ".json5"];
  const ext = path.extname(relPath);
  if (parts.length === 1 && configExts.includes(ext)) {
    return path.join(roots.config, relPath);
  }

  // .env at root → state/ (only in instance packs)
  if (parts.length === 1 && relPath === ".env") {
    return path.join(roots.state, relPath);
  }

  // Everything else → state/
  return path.join(roots.state, relPath);
}

function hasIncludedPath(includedPaths: readonly string[], pattern: RegExp): boolean {
  return includedPaths.some((includedPath) => pattern.test(includedPath));
}

function deriveHarnessComponents(includedPaths: readonly string[], configPath: string | null): HarnessComponent[] {
  const componentChecks: Array<[HarnessComponent, boolean]> = [
    ["workspace", hasIncludedPath(includedPaths, /^workspace(?:-[^/]+)?\//)],
    ["config", Boolean(configPath)],
    ["skills", hasIncludedPath(includedPaths, /^workspace(?:-[^/]+)?\/skills\//)],
    ["agents", hasIncludedPath(includedPaths, /^agents\//)],
    ["credentials", hasIncludedPath(includedPaths, /^credentials\//) || hasIncludedPath(includedPaths, /^agents\/[^/]+\/agent\/auth-profiles\.json$/)],
    ["sessions", hasIncludedPath(includedPaths, /^agents\/[^/]+\/sessions\//) || hasIncludedPath(includedPaths, /^sessions-[^/]+\.(json|json5)$/)],
    ["memory", hasIncludedPath(includedPaths, /^memory\//) || hasIncludedPath(includedPaths, /^[^/]+\.(db|sqlite|lance)$/)],
    ["cron", hasIncludedPath(includedPaths, /^cron\//)],
    ["hooks", hasIncludedPath(includedPaths, /^hooks\//)],
    ["extensions", hasIncludedPath(includedPaths, /^extensions\//)],
    ["logs", hasIncludedPath(includedPaths, /^logs\//)],
    ["browser", hasIncludedPath(includedPaths, /^browser\//)],
    ["completions", hasIncludedPath(includedPaths, /^completions\//)],
  ];

  return componentChecks
    .filter(([, present]) => present)
    .map(([component]) => component);
}

function createHarnessMetadata(includedPaths: readonly string[], configPath: string | null, targetProduct: string): HarnessMetadata {
  return {
    intent: "agent-runtime-environment",
    targetProduct,
    components: deriveHarnessComponents(includedPaths, configPath),
  };
}

interface ExportOptions {
  sourcePath?: string;
  outputPath?: string;
  packType: PackType;
  allowPackTypeOverride?: boolean;
  definitionPath?: string;
  cwd?: string;
}

interface CollectedFile {
  sourcePath: string;
  archivePath: string;
  manifestPath: string;
}

interface ExportResult {
  outputFile: string;
  manifest: Manifest;
  fileCount: number;
  totalSize: number;
  warnings: string[];
  policyWarnings: string[];
}

export async function exportPack(options: ExportOptions): Promise<ExportResult> {
  const stateDir = openClawAdapter.resolveStateDir(options.sourcePath);
  const configPath = openClawAdapter.findConfigFile(stateDir);
  const definitionFile = resolveDefinitionFile(options);
  const definition = definitionFile ? readHarnessDefinitionIfPresent(definitionFile) : null;
  if (!fs.existsSync(stateDir)) {
    throw new Error(`OpenClaw state directory not found: ${stateDir}`);
  }

  const inspectResult = openClawAdapter.inspect(options.sourcePath);
  if (!inspectResult.detected) {
    throw new Error("No OpenClaw instance detected at the specified path");
  }

  const packType = options.packType;
  const resolvedWorkspaceBindings = openClawAdapter.resolveWorkspaceBindings(stateDir, configPath);
  const workspaceBindings = resolvedWorkspaceBindings.map<WorkspaceBinding>((binding) => ({
    agentId: binding.agentId,
    logicalPath: binding.logicalPath,
    packPath: binding.packPath,
    isDefault: binding.isDefault,
  }));
  const workspaceDirNames = new Set(
    resolvedWorkspaceBindings
      .filter((binding) => path.dirname(binding.sourcePath) === stateDir)
      .map((binding) => path.basename(binding.sourcePath))
  );

  const filesToExport: CollectedFile[] = [];
  const stateFiles = collectFiles(stateDir, stateDir, packType, workspaceDirNames);
  for (const relPath of stateFiles) {
    filesToExport.push({
      sourcePath: path.join(stateDir, relPath),
      archivePath: classifyPath(relPath),
      manifestPath: relPath.split(path.sep).join("/"),
    });
  }

  for (const binding of resolvedWorkspaceBindings) {
    const workspaceFiles = collectFiles(binding.sourcePath, binding.sourcePath, packType);
    for (const relPath of workspaceFiles) {
      const normalizedRelPath = relPath.split(path.sep).join("/");
      filesToExport.push({
        sourcePath: path.join(binding.sourcePath, relPath),
        archivePath: path.posix.join(binding.packPath, normalizedRelPath),
        manifestPath: path.posix.join(binding.logicalPath, normalizedRelPath),
      });
    }
  }

  const includedPaths = filesToExport.map((file) => file.manifestPath);

  if (includedPaths.length === 0) {
    throw new Error("No files to export");
  }

  const packId = generatePackId();
  const bindings = createBindingSemantics(workspaceBindings);
  const lineage = resolveExportLineage({
    definition,
    definitionFile,
    packId,
  });
  const manifest: Manifest = {
    schemaVersion: SCHEMA_VERSION,
    packType,
    packId,
    createdAt: new Date().toISOString(),
    image: createImageMetadata(packId, openClawAdapter.id),
    lineage,
    placement: createPlacementContract(),
    rebinding: createRebindingContract(bindings),
    bindings,
    harness: createHarnessMetadata(includedPaths, configPath, inspectResult.product),
    source: {
      product: "openclaw",
      version: inspectResult.version || "unknown",
      configPath: configPath ? path.relative(stateDir, configPath) : "",
    },
    includedPaths,
    workspaces: workspaceBindings,
    sensitiveFlags: inspectResult.sensitiveFlags,
    riskLevel: assessRisk(inspectResult.sensitiveFlags, packType),
  };
  const warnings: string[] = [];
  const policyWarnings: string[] = [];
  if (inspectResult.recommendedPackType !== packType) {
    const divergenceMessage =
      `Inspect recommended ${inspectResult.recommendedPackType}; exporting ${packType} diverges from the recommended pack type.`;
    if (inspectResult.recommendedPackType === "instance" && packType === "template" && !options.allowPackTypeOverride) {
      throw new Error(`${divergenceMessage} Re-run with explicit pack-type override to allow a template downgrade.`);
    }
    policyWarnings.push(divergenceMessage);
  }
  if (packType === "instance" && inspectResult.recommendedPackType === "template") {
    policyWarnings.push(
      "Exporting instance for a source that qualifies for template will retain additional state for migration-oriented use."
    );
  }
  if (packType === "instance" && manifest.riskLevel === "trusted-migration-only") {
    policyWarnings.push(
      "Instance export is trusted-migration-only and may retain sensitive runtime state."
    );
  }
  const packTypeContractErrors = validatePackTypeComponents(packType, manifest.harness.components);
  if (packTypeContractErrors.length > 0) {
    throw new Error(`Pack type contract violation: ${packTypeContractErrors.join("; ")}`);
  }
  assertValidManifest(manifest);

  // Create staging directory
  const stagingDir = path.join(stateDir, ".harness-staging");
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true });
  }
  fs.mkdirSync(stagingDir, { recursive: true });

  try {
    // Write manifest
    fs.writeFileSync(
      path.join(stagingDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    // Create base pack directories
    const packDirs = [
      manifest.placement.componentRoots.config,
      manifest.placement.componentRoots.workspace,
      manifest.placement.componentRoots.reports,
    ];
    if (packType === "instance") packDirs.push(manifest.placement.componentRoots.state);
    if (workspaceBindings.some((binding) => !binding.isDefault)) {
      packDirs.push(manifest.placement.componentRoots.workspaces);
    }

    for (const dir of packDirs) {
      fs.mkdirSync(path.join(stagingDir, dir), { recursive: true });
    }

    // Copy files into pack structure, preserving directory hierarchy
    let totalSize = 0;
    for (const file of filesToExport) {
      const srcFile = file.sourcePath;
      const destRelPath = file.archivePath;
      const destFile = path.join(stagingDir, destRelPath);

      fs.mkdirSync(path.dirname(destFile), { recursive: true });
      fs.copyFileSync(srcFile, destFile);
      totalSize += fs.statSync(srcFile).size;
    }

    // Write export report
    const report = {
      exportedAt: manifest.createdAt,
      packType,
      packId: manifest.packId,
      fileCount: filesToExport.length,
      totalSize,
      riskLevel: manifest.riskLevel,
      sensitiveFlags: manifest.sensitiveFlags,
    };
    fs.writeFileSync(
      path.join(stagingDir, manifest.placement.componentRoots.reports, "export-report.json"),
      JSON.stringify(report, null, 2)
    );

    // Determine output path
    const outputFile = options.outputPath ||
      path.join(process.cwd(), `openclaw-${packType}-${Date.now()}.harness`);

    // Create tar.gz archive
    await tar.create(
      {
        gzip: true,
        file: outputFile,
        cwd: stagingDir,
      },
      fs.readdirSync(stagingDir)
    );

    return {
      outputFile,
      manifest,
      fileCount: filesToExport.length,
      totalSize,
      warnings: [...policyWarnings, ...warnings],
      policyWarnings,
    };
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}

function resolveDefinitionFile(options: ExportOptions): string | null {
  if (options.definitionPath) {
    return path.resolve(options.cwd ?? process.cwd(), options.definitionPath);
  }

  const implicitDefinition = path.resolve(options.cwd ?? process.cwd(), "harness.definition.json");
  if (fs.existsSync(implicitDefinition)) {
    return implicitDefinition;
  }

  if (options.sourcePath) {
    const sourceDefinition = path.resolve(openClawAdapter.resolveStateDir(options.sourcePath), "harness.definition.json");
    if (fs.existsSync(sourceDefinition)) {
      return sourceDefinition;
    }
  }

  return null;
}

function resolveExportLineage(params: {
  definition: ReturnType<typeof readHarnessDefinitionIfPresent>;
  definitionFile: string | null;
  packId: string;
}): HarnessImageLineage {
  if (!params.definition || !params.definitionFile) {
    return createInitialLineage();
  }

  const errors = validateOperationalDefinitionLineage(params.definition, params.definitionFile);
  if (errors.length > 0) {
    throw new Error(`Definition lineage validation failed: ${errors.join("; ")}`);
  }

  const parentImage = resolveDefinitionParentImage(params.definition, params.definitionFile);
  return createResolvedLineage(params.packId, parentImage);
}

interface ImportOptions {
  packFile: string;
  targetPath?: string;
}

interface ImportResult {
  targetDir: string;
  manifest: Manifest;
  fileCount: number;
  warnings: string[];
}

export async function importPack(options: ImportOptions): Promise<ImportResult> {
  const packFile = path.resolve(options.packFile);
  if (!fs.existsSync(packFile)) {
    throw new Error(`Pack file not found: ${packFile}`);
  }

  const tempDir = path.join(
    path.dirname(packFile),
    `.harness-import-${Date.now()}`
  );
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    await tar.extract({ file: packFile, cwd: tempDir });

    const manifestPath = path.join(tempDir, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      throw new Error("Invalid HarnessHub package: manifest.json not found");
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8")) as Manifest;
    assertValidManifest(manifest);

    const targetDir = options.targetPath
      ? path.resolve(options.targetPath)
      : openClawAdapter.resolveStateDir();

    const warnings: string[] = [];

    // Schema version check
    if (manifest.schemaVersion !== SCHEMA_VERSION) {
      warnings.push(
        `Schema version mismatch: pack is ${manifest.schemaVersion}, expected ${SCHEMA_VERSION}. Import may be incomplete.`
      );
    }

    if (manifest.riskLevel === "trusted-migration-only") {
      warnings.push(
        "This is a trusted-migration-only pack. It may contain sensitive data."
      );
    }

    if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
      warnings.push(
        `Target directory ${targetDir} is not empty. Files may be overwritten.`
      );
    }

    fs.mkdirSync(targetDir, { recursive: true });

    restoreImportedMaterialization(tempDir, targetDir, manifest);

    openClawAdapter.rebindImportedConfig(targetDir, manifest, warnings);
    fs.writeFileSync(
      path.join(targetDir, manifest.placement.persistedManifestPath),
      `${JSON.stringify(manifest, null, 2)}\n`
    );

    let fileCount = 0;
    function countFiles(dir: string) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile()) fileCount++;
        else if (entry.isDirectory()) countFiles(path.join(dir, entry.name));
      }
    }
    countFiles(targetDir);

    return { targetDir, manifest, fileCount, warnings };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";
import { openClawAdapter } from "./adapters/openclaw.js";
import {
  HARNESS_DEFINITION_FILE,
  HARNESS_DEFINITION_SCHEMA_VERSION,
  type HarnessAdapterId,
  type HarnessComponent,
  type HarnessDefinition,
  type OutputFormat,
  type WorkspaceBindingRule,
} from "./types.js";

const VALID_ADAPTER_IDS = new Set(["openclaw"]);
const VALID_HARNESS_COMPONENTS = new Set([
  "workspace",
  "config",
  "skills",
  "agents",
  "credentials",
  "sessions",
  "memory",
  "cron",
  "hooks",
  "extensions",
  "logs",
  "browser",
  "completions",
]);
const VALID_READINESS_TARGETS = new Set([
  "runtime_ready",
  "manual_steps_required",
  "structurally_invalid",
]);
const VALID_PARENT_REFERENCE_TYPES = new Set(["image-id", "path"]);
const VALID_BOOTSTRAP_MODES = new Set(["starter", "openclaw-path"]);
const VALID_HARNESS_KINDS = new Set(["harness-definition"]);
const VALID_HARNESS_INTENTS = new Set(["agent-runtime-environment"]);

export interface InitHarnessDefinitionOptions {
  cwd?: string;
  outputPath?: string;
  sourcePath?: string;
  imageId?: string;
  force?: boolean;
}

export interface InitHarnessDefinitionResult {
  definitionFile: string;
  definition: HarnessDefinition;
  initializedFrom: "starter" | "openclaw-path";
  warnings: string[];
}

export function initHarnessDefinition(options: InitHarnessDefinitionOptions): InitHarnessDefinitionResult {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const definitionFile = path.resolve(cwd, options.outputPath ?? HARNESS_DEFINITION_FILE);

  if (fs.existsSync(definitionFile) && !options.force) {
    throw new Error(`Definition file already exists: ${definitionFile}. Use --force to overwrite it.`);
  }

  const definition = options.sourcePath
    ? createDefinitionFromOpenClaw({
        cwd,
        sourcePath: options.sourcePath,
        imageId: options.imageId,
      })
    : createStarterDefinition({
        cwd,
        imageId: options.imageId,
      });

  fs.mkdirSync(path.dirname(definitionFile), { recursive: true });
  fs.writeFileSync(definitionFile, `${JSON.stringify(definition, null, 2)}\n`);

  return {
    definitionFile,
    definition,
    initializedFrom: definition.source.bootstrap,
    warnings: [],
  };
}

export function readHarnessDefinition(definitionFile: string): HarnessDefinition {
  const parsed = JSON.parse(fs.readFileSync(definitionFile, "utf8")) as unknown;
  assertValidHarnessDefinition(parsed);
  return parsed as HarnessDefinition;
}

export function assertValidHarnessDefinition(definition: unknown) {
  const errors = validateHarnessDefinition(definition);
  if (errors.length > 0) {
    throw new Error(`Harness definition validation failed: ${errors.join("; ")}`);
  }
}

export function validateHarnessDefinition(definition: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(definition)) {
    return ["definition must be an object"];
  }

  requireExactString(definition, "schemaVersion", errors);
  if (
    typeof definition.schemaVersion === "string"
    && definition.schemaVersion !== HARNESS_DEFINITION_SCHEMA_VERSION
  ) {
    errors.push(`schemaVersion must be ${HARNESS_DEFINITION_SCHEMA_VERSION}`);
  }

  requireEnumString(definition, "kind", VALID_HARNESS_KINDS, errors);
  validateDefinitionImage(definition.image, errors);
  validateDefinitionLineage(definition.lineage, errors);
  validateHarnessMetadata(definition.harness, errors);
  validateBindings(definition.bindings, errors);
  validateRebinding(definition.rebinding, errors);
  validateDefinitionSource(definition.source, errors);
  validateDefinitionVerify(definition.verify, errors);

  return errors;
}

export function formatInitDefinitionResult(result: InitHarnessDefinitionResult, format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({
      success: true,
      definitionFile: result.definitionFile,
      initializedFrom: result.initializedFrom,
      imageId: result.definition.image.imageId,
      adapter: result.definition.image.adapter,
      components: result.definition.harness.components,
      workspaceBindings: result.definition.bindings.workspaces.length,
      warnings: result.warnings,
    }, null, 2);
  }

  return [
    "",
    "=== HarnessHub Init ===",
    "",
    `  Definition:   ${result.definitionFile}`,
    `  Image ID:     ${result.definition.image.imageId}`,
    `  Adapter:      ${result.definition.image.adapter}`,
    `  From:         ${result.initializedFrom}`,
    `  Components:   ${result.definition.harness.components.join(", ") || "(none)"}`,
    `  Bindings:     ${result.definition.bindings.workspaces.length}`,
    "",
    "Definition initialized.",
    "",
  ].join("\n");
}

function createStarterDefinition(options: { cwd: string; imageId?: string }): HarnessDefinition {
  const imageId = normalizeImageId(options.imageId ?? path.basename(options.cwd));
  const components: HarnessComponent[] = ["config", "workspace", "skills"];
  const bindings = buildWorkspaceBindings(["workspace"]);

  return {
    schemaVersion: HARNESS_DEFINITION_SCHEMA_VERSION,
    kind: "harness-definition",
    image: {
      imageId,
      adapter: "openclaw",
    },
    lineage: {
      parentImage: null,
      layerOrder: [],
    },
    harness: {
      intent: "agent-runtime-environment",
      targetProduct: "openclaw",
      components,
    },
    bindings: {
      workspaces: bindings,
    },
    rebinding: {
      workspaceTargetMode: "absolute-path",
      mutableConfigTargets: collectMutableConfigTargets(bindings),
    },
    source: {
      bootstrap: "starter",
      detectedProduct: null,
      configPath: null,
    },
    verify: {
      readinessTarget: "runtime_ready",
      expectedComponents: components,
      requireWorkspaceBindings: true,
    },
  };
}

function createDefinitionFromOpenClaw(options: { cwd: string; sourcePath: string; imageId?: string }): HarnessDefinition {
  const inspection = openClawAdapter.inspect(options.sourcePath);
  if (!inspection.detected) {
    throw new Error(`Could not detect an OpenClaw instance at ${path.resolve(options.sourcePath)}.`);
  }

  const resolvedSourcePath = inspection.stateDir;
  const configPath = openClawAdapter.findConfigFile(resolvedSourcePath);
  const workspaceBindings = openClawAdapter.resolveWorkspaceBindings(resolvedSourcePath, configPath);
  const components = componentsFromInspection(inspection);
  const bindings = buildWorkspaceBindings(workspaceBindings.map((binding) => binding.logicalPath));
  const inferredImageId = options.imageId
    ?? readImageIdFromConfig(configPath)
    ?? path.basename(options.cwd)
    ?? path.basename(resolvedSourcePath);

  return {
    schemaVersion: HARNESS_DEFINITION_SCHEMA_VERSION,
    kind: "harness-definition",
    image: {
      imageId: normalizeImageId(inferredImageId),
      adapter: "openclaw",
    },
    lineage: {
      parentImage: null,
      layerOrder: [],
    },
    harness: {
      intent: "agent-runtime-environment",
      targetProduct: inspection.product,
      components,
    },
    bindings: {
      workspaces: bindings,
    },
    rebinding: {
      workspaceTargetMode: "absolute-path",
      mutableConfigTargets: collectMutableConfigTargets(bindings),
    },
    source: {
      bootstrap: "openclaw-path",
      detectedProduct: inspection.product,
      configPath: configPath ? path.basename(configPath) : null,
    },
    verify: {
      readinessTarget: "runtime_ready",
      expectedComponents: components,
      requireWorkspaceBindings: bindings.length > 0,
    },
  };
}

function componentsFromInspection(inspection: ReturnType<typeof openClawAdapter.inspect>): HarnessComponent[] {
  const components: HarnessComponent[] = [];

  if (inspection.structure.hasConfig) components.push("config");
  if (inspection.structure.hasWorkspace) components.push("workspace");
  if (inspection.structure.hasSkills) components.push("skills");
  if (inspection.structure.hasAgents) components.push("agents");
  if (inspection.structure.hasCredentials) components.push("credentials");
  if (inspection.structure.hasSessions) components.push("sessions");
  if (inspection.structure.hasMemory) components.push("memory");
  if (inspection.structure.hasCron) components.push("cron");
  if (inspection.structure.hasHooks) components.push("hooks");
  if (inspection.structure.hasExtensions) components.push("extensions");
  if (inspection.structure.hasLogs) components.push("logs");
  if (inspection.structure.hasBrowser) components.push("browser");
  if (inspection.structure.hasCompletions) components.push("completions");

  return components;
}

function buildWorkspaceBindings(logicalPaths: string[]): WorkspaceBindingRule[] {
  return logicalPaths.map((logicalPath) => {
    const isDefault = logicalPath === "workspace";
    const agentId = isDefault ? "main" : logicalPath.slice("workspace-".length);
    const configTarget = isDefault
      ? "agents.defaults.workspace"
      : `agents.list[${agentId}].workspace`;

    return {
      agentId,
      logicalPath,
      targetRelativePath: logicalPath === "workspace"
        ? "workspace"
        : path.posix.join("workspaces", agentId),
      configTargets: [configTarget],
      required: true,
    };
  });
}

function collectMutableConfigTargets(bindings: WorkspaceBindingRule[]): string[] {
  return bindings.flatMap((binding) => binding.configTargets);
}

function readImageIdFromConfig(configPath: string | null): string | null {
  if (!configPath || !fs.existsSync(configPath)) return null;
  try {
    const parsed = JSON5.parse(fs.readFileSync(configPath, "utf8")) as Record<string, unknown>;
    const identity = parsed.identity;
    if (isRecord(identity) && typeof identity.name === "string" && identity.name.trim().length > 0) {
      return identity.name;
    }
  } catch {
    return null;
  }

  return null;
}

function validateDefinitionImage(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("image must be an object");
    return;
  }
  requireExactString(value, "imageId", errors, "image.imageId");
  requireEnumString(value, "adapter", VALID_ADAPTER_IDS, errors, "image.adapter");
}

function validateDefinitionLineage(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("lineage must be an object");
    return;
  }

  if (value.parentImage !== null) {
    if (!isRecord(value.parentImage)) {
      errors.push("lineage.parentImage must be null or an object");
    } else {
      requireEnumString(value.parentImage, "refType", VALID_PARENT_REFERENCE_TYPES, errors, "lineage.parentImage.refType");
      requireExactString(value.parentImage, "value", errors, "lineage.parentImage.value");
    }
  }

  validateStringArray(value.layerOrder, "lineage.layerOrder", errors);
}

function validateHarnessMetadata(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("harness must be an object");
    return;
  }
  requireEnumString(value, "intent", VALID_HARNESS_INTENTS, errors, "harness.intent");
  requireExactString(value, "targetProduct", errors, "harness.targetProduct");
  if (!Array.isArray(value.components) || value.components.some((component) => !VALID_HARNESS_COMPONENTS.has(String(component)))) {
    errors.push(`harness.components must contain only: ${[...VALID_HARNESS_COMPONENTS].join(", ")}`);
  }
}

function validateBindings(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("bindings must be an object");
    return;
  }
  if (!Array.isArray(value.workspaces)) {
    errors.push("bindings.workspaces must be an array");
    return;
  }
  value.workspaces.forEach((workspace, index) => validateWorkspaceBindingRule(workspace, index, errors));
}

function validateRebinding(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("rebinding must be an object");
    return;
  }
  if (value.workspaceTargetMode !== "absolute-path") {
    errors.push("rebinding.workspaceTargetMode must be absolute-path");
  }
  validateStringArray(value.mutableConfigTargets, "rebinding.mutableConfigTargets", errors);
}

function validateWorkspaceBindingRule(value: unknown, index: number, errors: string[]) {
  if (!isRecord(value)) {
    errors.push(`bindings.workspaces[${index}] must be an object`);
    return;
  }
  requireExactString(value, "agentId", errors, `bindings.workspaces[${index}].agentId`);
  requireExactString(value, "logicalPath", errors, `bindings.workspaces[${index}].logicalPath`);
  requireExactString(value, "targetRelativePath", errors, `bindings.workspaces[${index}].targetRelativePath`);
  validateStringArray(value.configTargets, `bindings.workspaces[${index}].configTargets`, errors);
  if (typeof value.required !== "boolean") {
    errors.push(`bindings.workspaces[${index}].required must be a boolean`);
  }
}

function validateDefinitionSource(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("source must be an object");
    return;
  }
  requireEnumString(value, "bootstrap", VALID_BOOTSTRAP_MODES, errors, "source.bootstrap");
  if (!(value.detectedProduct === null || typeof value.detectedProduct === "string")) {
    errors.push("source.detectedProduct must be a string or null");
  }
  if (!(value.configPath === null || typeof value.configPath === "string")) {
    errors.push("source.configPath must be a string or null");
  }
}

function validateDefinitionVerify(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("verify must be an object");
    return;
  }
  requireEnumString(value, "readinessTarget", VALID_READINESS_TARGETS, errors, "verify.readinessTarget");
  if (!Array.isArray(value.expectedComponents) || value.expectedComponents.some((component) => !VALID_HARNESS_COMPONENTS.has(String(component)))) {
    errors.push(`verify.expectedComponents must contain only: ${[...VALID_HARNESS_COMPONENTS].join(", ")}`);
  }
  if (typeof value.requireWorkspaceBindings !== "boolean") {
    errors.push("verify.requireWorkspaceBindings must be a boolean");
  }
}

function validateStringArray(value: unknown, label: string, errors: string[]) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    errors.push(`${label} must be an array of strings`);
  }
}

function requireExactString(value: Record<string, unknown>, key: string, errors: string[], label = key) {
  if (!isNonEmptyString(value[key])) {
    errors.push(`${label} must be a non-empty string`);
  }
}

function requireEnumString(value: Record<string, unknown>, key: string, allowed: Set<string>, errors: string[], label = key) {
  if (!isNonEmptyString(value[key]) || !allowed.has(String(value[key]))) {
    errors.push(`${label} must be one of: ${[...allowed].join(", ")}`);
  }
}

function normalizeImageId(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const normalized = trimmed
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length === 0) {
    throw new Error("Could not derive a valid image id. Pass --image-id explicitly.");
  }

  return normalized;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

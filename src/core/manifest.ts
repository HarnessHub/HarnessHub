import { SCHEMA_VERSION } from "./types.js";

const VALID_PACK_TYPES = new Set(["template", "instance"]);
const VALID_RISK_LEVELS = new Set(["safe-share", "internal-only", "trusted-migration-only"]);
const VALID_HARNESS_INTENTS = new Set(["agent-runtime-environment"]);

export function validateManifestContract(manifest: unknown): string[] {
  const errors: string[] = [];

  if (!isRecord(manifest)) {
    return ["manifest must be an object"];
  }

  requireExactString(manifest, "schemaVersion", errors);
  if (typeof manifest.schemaVersion === "string" && manifest.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`schemaVersion must be ${SCHEMA_VERSION}`);
  }

  requireEnumString(manifest, "packType", VALID_PACK_TYPES, errors);
  requireExactString(manifest, "packId", errors);
  requireExactString(manifest, "createdAt", errors);

  validateImageMetadata(manifest.image, errors);
  validateLineage(manifest.lineage, manifest.image, errors);
  validatePlacement(manifest.placement, errors);
  validateRebinding(manifest.rebinding, errors);
  validateBindings(manifest.bindings, errors);
  validateHarnessMetadata(manifest.harness, errors);
  validateSource(manifest.source, errors);
  validateStringArray(manifest.includedPaths, "includedPaths", errors);
  validateWorkspaces(manifest.workspaces, errors);
  validateSensitiveFlags(manifest.sensitiveFlags, errors);
  requireEnumString(manifest, "riskLevel", VALID_RISK_LEVELS, errors);

  return errors;
}

export function assertValidManifest(manifest: unknown) {
  const errors = validateManifestContract(manifest);
  if (errors.length > 0) {
    throw new Error(`Manifest contract validation failed: ${errors.join("; ")}`);
  }
}

function validateImageMetadata(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("image must be an object");
    return;
  }
  requireExactString(value, "imageId", errors, "image.imageId");
  requireExactString(value, "adapter", errors, "image.adapter");
}

function validateLineage(value: unknown, imageMetadata: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("lineage must be an object");
    return;
  }
  if (!(value.parentImage === null || (isRecord(value.parentImage) && isNonEmptyString(value.parentImage.imageId)))) {
    errors.push("lineage.parentImage must be null or an object with imageId");
  }
  validateStringArray(value.layerOrder, "lineage.layerOrder", errors);
  if (value.parentImage === null && Array.isArray(value.layerOrder) && value.layerOrder.length !== 0) {
    errors.push("lineage.layerOrder must be empty when lineage.parentImage is null");
  }
  if (isRecord(value.parentImage) && isNonEmptyString(value.parentImage.imageId)) {
    if (!Array.isArray(value.layerOrder) || value.layerOrder.length !== 2) {
      errors.push("lineage.layerOrder must contain parent and child image ids when lineage.parentImage is set");
      return;
    }
    if (value.layerOrder[0] !== value.parentImage.imageId) {
      errors.push("lineage.layerOrder[0] must match lineage.parentImage.imageId");
    }
    if (isRecord(imageMetadata) && isNonEmptyString(imageMetadata.imageId) && value.layerOrder[1] !== imageMetadata.imageId) {
      errors.push("lineage.layerOrder[1] must match image.imageId");
    }
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

function validatePlacement(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("placement must be an object");
    return;
  }
  validateStringArray(value.reservedRoots, "placement.reservedRoots", errors);
  if (!isRecord(value.componentRoots)) {
    errors.push("placement.componentRoots must be an object");
  } else {
    requireExactString(value.componentRoots, "config", errors, "placement.componentRoots.config");
    requireExactString(value.componentRoots, "workspace", errors, "placement.componentRoots.workspace");
    requireExactString(value.componentRoots, "workspaces", errors, "placement.componentRoots.workspaces");
    requireExactString(value.componentRoots, "reports", errors, "placement.componentRoots.reports");
    requireExactString(value.componentRoots, "state", errors, "placement.componentRoots.state");
  }
  requireExactString(value, "persistedManifestPath", errors, "placement.persistedManifestPath");
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

function validateHarnessMetadata(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("harness must be an object");
    return;
  }
  requireEnumString(value, "intent", VALID_HARNESS_INTENTS, errors, "harness.intent");
  requireExactString(value, "targetProduct", errors, "harness.targetProduct");
  validateStringArray(value.components, "harness.components", errors);
}

function validateSource(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("source must be an object");
    return;
  }
  requireExactString(value, "product", errors, "source.product");
  requireExactString(value, "version", errors, "source.version");
  if (typeof value.configPath !== "string") {
    errors.push("source.configPath must be a string");
  }
}

function validateWorkspaces(value: unknown, errors: string[]) {
  if (!Array.isArray(value)) {
    errors.push("workspaces must be an array");
    return;
  }
  value.forEach((workspace, index) => {
    if (!isRecord(workspace)) {
      errors.push(`workspaces[${index}] must be an object`);
      return;
    }
    requireExactString(workspace, "agentId", errors, `workspaces[${index}].agentId`);
    requireExactString(workspace, "logicalPath", errors, `workspaces[${index}].logicalPath`);
    requireExactString(workspace, "packPath", errors, `workspaces[${index}].packPath`);
    if (typeof workspace.isDefault !== "boolean") {
      errors.push(`workspaces[${index}].isDefault must be a boolean`);
    }
  });
}

function validateSensitiveFlags(value: unknown, errors: string[]) {
  if (!isRecord(value)) {
    errors.push("sensitiveFlags must be an object");
    return;
  }
  const keys = [
    "hasCredentials",
    "hasApiKeys",
    "hasOAuthTokens",
    "hasAuthProfiles",
    "hasWhatsAppCreds",
    "hasCopilotToken",
    "hasSessions",
    "hasMemoryDb",
    "hasEnvFile",
  ];
  for (const key of keys) {
    if (typeof value[key] !== "boolean") {
      errors.push(`sensitiveFlags.${key} must be a boolean`);
    }
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

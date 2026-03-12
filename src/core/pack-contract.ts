import type { HarnessComponent, PackType } from "./types.js";

const TEMPLATE_FORBIDDEN_COMPONENTS = new Set<HarnessComponent>([
  "agents",
  "credentials",
  "sessions",
  "memory",
  "logs",
  "browser",
]);

const TEMPLATE_FORBIDDEN_TOP_LEVEL_DIRS = new Set([
  "agents",
  "credentials",
  "memory",
  "logs",
  "browser",
  "devices",
  "identity",
]);

export function isForbiddenInPackType(relativePath: string, packType: PackType): boolean {
  if (packType !== "template") return false;
  const topLevel = relativePath.split("/")[0] ?? "";
  return TEMPLATE_FORBIDDEN_TOP_LEVEL_DIRS.has(topLevel);
}

export function validatePackTypeComponents(packType: PackType, components: readonly HarnessComponent[]): string[] {
  if (packType !== "template") return [];
  return components
    .filter((component) => TEMPLATE_FORBIDDEN_COMPONENTS.has(component))
    .map((component) => `template packs must not include ${component}`);
}

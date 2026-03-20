import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";
import { validateHarnessDefinition, validateOperationalDefinitionLineage } from "./definition.js";
import type { HarnessComponent, HarnessDefinition, Manifest, VerifyResult, VerifyCheck, ReadinessClass } from "./types.js";
import { SCHEMA_VERSION } from "./types.js";
import { openClawAdapter } from "./adapters/openclaw.js";
import { validateManifestContract } from "./manifest.js";
import { validatePackTypeComponents } from "./pack-contract.js";

const REQUIRED_WORKSPACE_FILES = ["AGENTS.md"];

export function verify(targetDir: string, manifest?: Manifest, definition?: unknown): VerifyResult {
  const checks: VerifyCheck[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const runtimeReadinessIssues: string[] = [];
  const manifestWorkspaces = manifest?.workspaces ?? [];
  const manifestBindingRules = manifest?.bindings?.workspaces ?? [];
  const parsedDefinition = definition as HarnessDefinition | undefined;

  // Check 1: Target directory exists
  const dirExists = fs.existsSync(targetDir);
  checks.push({
    name: "directory_exists",
    passed: dirExists,
    message: dirExists
      ? `Target directory exists: ${targetDir}`
      : `Target directory not found: ${targetDir}`,
  });

  if (!dirExists) {
    errors.push("Target directory does not exist");
    runtimeReadinessIssues.push("Target directory does not exist");
    return finalizeVerifyResult(checks, warnings, errors, runtimeReadinessIssues);
  }

  // Check 2: Config file exists
  const configPath = openClawAdapter.findConfigFile(targetDir);
  const hasConfig = configPath !== null;
  checks.push({
    name: "config_exists",
    passed: hasConfig,
    message: hasConfig
      ? `Config file found: ${path.basename(configPath!)}`
      : "No OpenClaw config file found",
  });
  if (!hasConfig) {
    warnings.push("No config file found - instance may need manual configuration");
    runtimeReadinessIssues.push("No OpenClaw config file found");
  }

  // Check 3: Workspace directory exists
  const resolvedWorkspaces = openClawAdapter.resolveWorkspaceBindings(targetDir, configPath);
  const workspaceDirs = manifestWorkspaces.length > 0
    ? manifestWorkspaces.map((workspace) =>
        workspace.isDefault ? "workspace" : workspace.logicalPath
      )
    : resolvedWorkspaces.map((workspace) => workspace.logicalPath);
  const wsDir = path.join(targetDir, "workspace");
  const hasWorkspace = workspaceDirs.some((dir) => fs.existsSync(path.join(targetDir, dir)));
  checks.push({
    name: "workspace_exists",
    passed: hasWorkspace,
    message: hasWorkspace
      ? `Workspace directories found: ${workspaceDirs.join(", ")}`
      : "Workspace directory not found",
  });
  if (!hasWorkspace) {
    errors.push("Workspace directory is missing");
  }

  // Check 4: Required workspace files
  if (hasWorkspace) {
    for (const file of REQUIRED_WORKSPACE_FILES) {
      const existingWorkspace = workspaceDirs.find((dir) =>
        fs.existsSync(path.join(targetDir, dir, file))
      );
      const exists = Boolean(existingWorkspace);
      checks.push({
        name: `workspace_file_${file.toLowerCase()}`,
        passed: exists,
        message: exists
          ? `Workspace file exists: ${existingWorkspace}/${file}`
          : `Required workspace file missing: ${file}`,
      });
      if (!exists) {
        warnings.push(`Workspace file missing: ${file}`);
        runtimeReadinessIssues.push(`Workspace file missing: ${file}`);
      }
    }
  }

  // Check 5: Config file is valid JSON/JSON5
  if (hasConfig && configPath) {
    let configValid = false;
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      JSON5.parse(content);
      configValid = true;
    } catch {
      warnings.push("Config file may not be valid JSON/JSON5");
      runtimeReadinessIssues.push("Config file appears invalid");
    }
    checks.push({
      name: "config_valid",
      passed: configValid,
      message: configValid
        ? "Config file is valid"
        : "Config file appears invalid",
    });
  }

  // Check 6: Agents directory structure
  const agentsDir = path.join(targetDir, "agents");
  if (fs.existsSync(agentsDir)) {
    try {
      const agentIds = fs.readdirSync(agentsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      checks.push({
        name: "agents_present",
        passed: agentIds.length > 0,
        message: agentIds.length > 0
          ? `Agent directories found: ${agentIds.join(", ")}`
          : "No agent directories in agents/",
      });

      // Verify each agent has expected structure
      for (const agentId of agentIds) {
        const agentDir = path.join(agentsDir, agentId, "agent");
        const hasAgentDir = fs.existsSync(agentDir);
        if (!hasAgentDir) {
          warnings.push(`Agent "${agentId}" missing agent/ subdirectory`);
          runtimeReadinessIssues.push(`Agent "${agentId}" missing agent/ subdirectory`);
        }
      }
    } catch { /* ignore */ }
  }

  // Check 7: Manifest validation
  if (manifest) {
    const manifestContractErrors = validateManifestContract(manifest);
    checks.push({
      name: "manifest_contract",
      passed: manifestContractErrors.length === 0,
      message: manifestContractErrors.length === 0
        ? "Manifest contract is valid"
        : manifestContractErrors.join("; "),
    });
    if (manifestContractErrors.length > 0) {
      errors.push(...manifestContractErrors.map((error: string) => `Manifest contract error: ${error}`));
      runtimeReadinessIssues.push(...manifestContractErrors.map((error: string) => `Manifest contract error: ${error}`));
      return finalizeVerifyResult(checks, warnings, errors, runtimeReadinessIssues);
    }

    const schemaMatch = manifest.schemaVersion === SCHEMA_VERSION;
    checks.push({
      name: "manifest_schema",
      passed: schemaMatch,
      message: schemaMatch
        ? `Schema version: ${manifest.schemaVersion}`
        : `Schema version mismatch: ${manifest.schemaVersion} (expected ${SCHEMA_VERSION})`,
    });
    if (!schemaMatch) {
      warnings.push(`Pack was created with schema ${manifest.schemaVersion}, current is ${SCHEMA_VERSION}`);
    }

    checks.push({
      name: "manifest_pack_type",
      passed: ["template", "instance"].includes(manifest.packType),
      message: `Pack type: ${manifest.packType}`,
    });

    const hasPlacementContract =
      Array.isArray(manifest.placement?.reservedRoots) &&
      manifest.placement.reservedRoots.length >= 5 &&
      typeof manifest.placement?.persistedManifestPath === "string" &&
      manifest.placement.persistedManifestPath.length > 0;
    checks.push({
      name: "manifest_placement",
      passed: hasPlacementContract,
      message: hasPlacementContract
        ? `Placement roots: ${manifest.placement.reservedRoots.join(", ")}`
        : "Manifest placement contract missing or invalid",
    });
    if (!hasPlacementContract) {
      warnings.push("Manifest placement contract missing or invalid");
      runtimeReadinessIssues.push("Manifest placement contract missing or invalid");
    }

    const hasRebindingContract =
      manifest.rebinding?.workspaceTargetMode === "absolute-path" &&
      Array.isArray(manifest.rebinding?.mutableConfigTargets);
    checks.push({
      name: "manifest_rebinding",
      passed: hasRebindingContract,
      message: hasRebindingContract
        ? `Rebinding targets: ${manifest.rebinding.mutableConfigTargets.join(", ")}`
        : "Manifest rebinding contract missing or invalid",
    });
    if (!hasRebindingContract) {
      warnings.push("Manifest rebinding contract missing or invalid");
      runtimeReadinessIssues.push("Manifest rebinding contract missing or invalid");
    }

    const packTypeContractErrors = validatePackTypeComponents(
      manifest.packType,
      manifest.harness.components
    );
    checks.push({
      name: "pack_type_contract",
      passed: packTypeContractErrors.length === 0,
      message: packTypeContractErrors.length === 0
        ? `${manifest.packType} contract satisfied`
        : packTypeContractErrors.join("; "),
    });
    if (packTypeContractErrors.length > 0) {
      errors.push(...packTypeContractErrors.map((error) => `Pack type contract error: ${error}`));
      runtimeReadinessIssues.push(...packTypeContractErrors.map((error) => `Pack type contract error: ${error}`));
    }

    const hasImageMetadata =
      typeof manifest.image?.imageId === "string" &&
      manifest.image.imageId.length > 0 &&
      typeof manifest.image?.adapter === "string" &&
      manifest.image.adapter.length > 0;
    checks.push({
      name: "manifest_image",
      passed: hasImageMetadata,
      message: hasImageMetadata
        ? `Image identity: ${manifest.image.imageId} via ${manifest.image.adapter}`
        : "Manifest image metadata missing or invalid",
    });
    if (!hasImageMetadata) {
      warnings.push("Pack manifest does not declare explicit image identity metadata");
    }

    const hasLineageMetadata =
      manifest.lineage !== undefined &&
      Array.isArray(manifest.lineage.layerOrder) &&
      (manifest.lineage.parentImage === null ||
        (typeof manifest.lineage.parentImage?.imageId === "string" &&
          manifest.lineage.parentImage.imageId.length > 0));
    checks.push({
      name: "manifest_lineage",
      passed: hasLineageMetadata,
      message: hasLineageMetadata
        ? `Manifest lineage declared with ${manifest.lineage.layerOrder.length} reserved layers`
        : "Manifest lineage metadata missing or invalid",
    });
    if (!hasLineageMetadata) {
      warnings.push("Pack manifest does not reserve explicit lineage metadata for future composition");
    }

    const hasHarnessMetadata =
      manifest.harness?.intent === "agent-runtime-environment" &&
      typeof manifest.harness?.targetProduct === "string" &&
      manifest.harness.targetProduct.length > 0;
    checks.push({
      name: "manifest_harness",
      passed: hasHarnessMetadata,
      message: hasHarnessMetadata
        ? `Harness intent: ${manifest.harness.intent} for ${manifest.harness.targetProduct}`
        : "Manifest harness metadata missing or invalid",
    });
    if (!hasHarnessMetadata) {
      warnings.push("Pack manifest does not describe a reusable agent runtime environment");
    }

    if (manifestWorkspaces.length > 0) {
      const missingWorkspace = manifestWorkspaces.find((workspace) => {
        const logicalPath = workspace.isDefault ? "workspace" : workspace.logicalPath;
        return !fs.existsSync(path.join(targetDir, logicalPath));
      });
      checks.push({
        name: "workspace_bindings",
        passed: !missingWorkspace,
        message: missingWorkspace
          ? `Missing imported workspace: ${missingWorkspace.logicalPath}`
          : `Imported workspaces: ${manifestWorkspaces.map((w) => w.logicalPath).join(", ")}`,
      });
      if (missingWorkspace) {
        warnings.push(`Missing imported workspace: ${missingWorkspace.logicalPath}`);
        runtimeReadinessIssues.push(`Missing imported workspace: ${missingWorkspace.logicalPath}`);
      }
    }

    if (manifestBindingRules.length > 0) {
      const configPathForBindings = openClawAdapter.findConfigFile(targetDir);
      const bindingFailures: string[] = [];
      let parsedConfig: any = null;
      if (configPathForBindings) {
        try {
          parsedConfig = JSON5.parse(fs.readFileSync(configPathForBindings, "utf-8"));
        } catch {
          warnings.push(`Could not parse config to validate binding semantics: ${path.basename(configPathForBindings)}`);
          runtimeReadinessIssues.push(`Could not parse config to validate binding semantics: ${path.basename(configPathForBindings)}`);
        }
      }

      for (const binding of manifestBindingRules) {
        const expectedPath = path.join(targetDir, binding.targetRelativePath);
        if (binding.required && !fs.existsSync(expectedPath)) {
          bindingFailures.push(`Missing bound workspace target ${binding.targetRelativePath}`);
        }
        if (!parsedConfig) continue;

        if (binding.targetRelativePath === "workspace") {
          if (parsedConfig.agents?.defaults?.workspace !== expectedPath) {
            bindingFailures.push(`Default workspace binding not rebound to ${binding.targetRelativePath}`);
          }
        }

        const agentEntry = Array.isArray(parsedConfig.agents?.list)
          ? parsedConfig.agents.list.find((entry: any) => {
              const id = typeof entry?.id === "string" ? entry.id.trim().toLowerCase() : "";
              return id === binding.agentId;
            })
          : null;
        if (agentEntry && agentEntry.workspace !== expectedPath) {
          bindingFailures.push(`Agent ${binding.agentId} workspace binding not rebound to ${binding.targetRelativePath}`);
        }
      }

      checks.push({
        name: "binding_semantics",
        passed: bindingFailures.length === 0,
        message: bindingFailures.length === 0
          ? `Binding semantics validated for ${manifestBindingRules.length} workspaces`
          : bindingFailures.join("; "),
      });
      warnings.push(...bindingFailures);
      runtimeReadinessIssues.push(...bindingFailures);
    }

    // Check that expected file count roughly matches
    let actualFileCount = 0;
    function countFiles(dir: string) {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isFile()) actualFileCount++;
        else if (entry.isDirectory()) countFiles(path.join(dir, entry.name));
      }
    }
    countFiles(targetDir);

    const expectedCount = manifest.includedPaths.length;
    const countMatch = actualFileCount >= expectedCount;
    checks.push({
      name: "file_count",
      passed: countMatch,
      message: countMatch
        ? `File count: ${actualFileCount} (expected >= ${expectedCount})`
        : `File count mismatch: ${actualFileCount} actual vs ${expectedCount} expected`,
    });
    if (!countMatch) {
      warnings.push(`Some files may not have been imported: ${actualFileCount} found vs ${expectedCount} expected`);
    }
  }

  if (definition !== undefined) {
    const definitionErrors = validateHarnessDefinition(definition);
    const operationalDefinitionErrors = definitionErrors.length === 0
      ? validateOperationalDefinitionLineage(definition as HarnessDefinition)
      : [];
    const allDefinitionErrors = [...definitionErrors, ...operationalDefinitionErrors];
    checks.push({
      name: "definition_contract",
      passed: allDefinitionErrors.length === 0,
      message: allDefinitionErrors.length === 0
        ? "Definition contract is valid"
        : allDefinitionErrors.join("; "),
    });
    if (allDefinitionErrors.length > 0) {
      errors.push(...allDefinitionErrors.map((error) => `Definition contract error: ${error}`));
      runtimeReadinessIssues.push(...allDefinitionErrors.map((error) => `Definition contract error: ${error}`));
      return finalizeVerifyResult(checks, warnings, errors, runtimeReadinessIssues);
    }
  }

  const lineageMetadata = resolveLineageMetadata(manifest, parsedDefinition);
  if (lineageMetadata) {
    const declarationErrors = validateLineageDeclaration(lineageMetadata.parentImageId, lineageMetadata.layerOrder, lineageMetadata.childImageId);
    checks.push({
      name: "lineage_declaration",
      passed: declarationErrors.length === 0,
      message: declarationErrors.length === 0
        ? `Lineage declaration ${lineageMetadata.parentImageId ?? "root"} -> ${lineageMetadata.childImageId}`
        : declarationErrors.join("; "),
    });
    if (declarationErrors.length > 0) {
      errors.push(...declarationErrors.map((error) => `Lineage declaration error: ${error}`));
      runtimeReadinessIssues.push(...declarationErrors.map((error) => `Lineage declaration error: ${error}`));
      return finalizeVerifyResult(checks, warnings, errors, runtimeReadinessIssues);
    }

    const expectedComponents = parsedDefinition?.verify.expectedComponents
      ?? manifest?.harness?.components
      ?? [];
    const materializationFailures = validateLineageMaterialization(targetDir, expectedComponents);
    checks.push({
      name: "lineage_materialization",
      passed: materializationFailures.length === 0,
      message: materializationFailures.length === 0
        ? `Lineage materialization validated for ${expectedComponents.length} expected components`
        : materializationFailures.join("; "),
    });
    warnings.push(...materializationFailures);
    runtimeReadinessIssues.push(...materializationFailures);
  }

  // Check 8: Workspace files are readable
  if (hasWorkspace) {
    const wsFiles = workspaceDirs.flatMap((dir) => {
      const currentDir = path.join(targetDir, dir);
      if (!fs.existsSync(currentDir)) return [];
      return fs.readdirSync(currentDir)
        .filter((file) => file.endsWith(".md"))
        .map((file) => path.join(dir, file));
    });
    let allReadable = true;
    for (const file of wsFiles) {
      try {
        fs.accessSync(path.join(targetDir, file), fs.constants.R_OK);
      } catch {
        allReadable = false;
        warnings.push(`Workspace file not readable: ${file}`);
      }
    }
    checks.push({
      name: "workspace_readable",
      passed: allReadable,
      message: allReadable
        ? "All workspace files are readable"
        : "Some workspace files are not readable",
    });
  }

  const valid = errors.length === 0 && checks.every(
    c => c.passed || !["directory_exists", "workspace_exists"].includes(c.name)
  );
  return finalizeVerifyResult(checks, warnings, errors, runtimeReadinessIssues, valid);
}

function resolveLineageMetadata(
  manifest: Manifest | undefined,
  definition: HarnessDefinition | undefined
): { parentImageId: string | null; childImageId: string; layerOrder: string[] } | null {
  if (manifest) {
    return {
      parentImageId: manifest.lineage.parentImage?.imageId ?? null,
      childImageId: manifest.image.imageId,
      layerOrder: manifest.lineage.layerOrder,
    };
  }
  if (definition) {
    return {
      parentImageId: definition.lineage.parentImage?.value ?? null,
      childImageId: definition.image.imageId,
      layerOrder: definition.lineage.layerOrder,
    };
  }
  return null;
}

function validateLineageDeclaration(
  parentImageId: string | null,
  layerOrder: readonly string[],
  childImageId: string
): string[] {
  const errors: string[] = [];
  if (parentImageId === null) {
    if (layerOrder.length !== 0) {
      errors.push("Lineage layer order must be empty when no parent image is declared");
    }
    return errors;
  }
  if (layerOrder.length !== 2) {
    errors.push("Lineage layer order must contain exactly two entries when a parent image is declared");
    return errors;
  }
  if (layerOrder[0] !== parentImageId) {
    errors.push("Lineage layer order must start with the declared parent image id");
  }
  if (layerOrder[1] !== childImageId) {
    errors.push("Lineage layer order must end with the declared child image id");
  }
  return errors;
}

function validateLineageMaterialization(targetDir: string, expectedComponents: readonly HarnessComponent[]): string[] {
  const failures: string[] = [];
  for (const component of expectedComponents) {
    switch (component) {
      case "workspace":
        if (!hasWorkspaceMaterialized(targetDir)) {
          failures.push("Lineage materialization missing expected component: workspace");
        }
        break;
      case "config":
        if (openClawAdapter.findConfigFile(targetDir) === null) {
          failures.push("Lineage materialization missing expected component: config");
        }
        break;
      case "skills":
        if (!hasSkillsMaterialized(targetDir)) {
          failures.push("Lineage materialization missing expected component: skills");
        }
        break;
      default:
        break;
    }
  }
  return failures;
}

function hasWorkspaceMaterialized(targetDir: string): boolean {
  return fs.existsSync(path.join(targetDir, "workspace"))
    || fs.readdirSync(targetDir, { withFileTypes: true }).some((entry) => entry.isDirectory() && entry.name.startsWith("workspace-"));
}

function hasSkillsMaterialized(targetDir: string): boolean {
  const workspaceRoots = ["workspace", ...fs.readdirSync(targetDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("workspace-"))
    .map((entry) => entry.name)];
  return workspaceRoots.some((workspaceRoot) => fs.existsSync(path.join(targetDir, workspaceRoot, "skills")));
}

function finalizeVerifyResult(
  checks: VerifyCheck[],
  warnings: string[],
  errors: string[],
  runtimeReadinessIssues: string[],
  valid = errors.length === 0 && checks.every(
    (check) => check.passed || !["directory_exists", "workspace_exists"].includes(check.name)
  ),
): VerifyResult {
  const readinessClass = classifyReadiness(valid, runtimeReadinessIssues);
  const runtimeReady = readinessClass === "runtime_ready";
  const remediationSteps = deriveRemediationSteps(readinessClass, runtimeReadinessIssues);
  return {
    valid,
    runtimeReady,
    readinessClass,
    readinessSummary: summarizeReadiness(readinessClass),
    runtimeReadinessIssues,
    remediationSteps,
    checks,
    warnings,
    errors,
  };
}

function classifyReadiness(valid: boolean, runtimeReadinessIssues: string[]): ReadinessClass {
  if (!valid) {
    return "structurally_invalid";
  }
  if (runtimeReadinessIssues.length > 0) {
    return "manual_steps_required";
  }
  return "runtime_ready";
}

function summarizeReadiness(readinessClass: ReadinessClass): string {
  switch (readinessClass) {
    case "runtime_ready":
      return "Imported harness is structurally valid and ready to run without additional manual steps.";
    case "manual_steps_required":
      return "Imported harness is structurally valid but still needs manual follow-up before it is runtime-ready.";
    case "structurally_invalid":
      return "Imported harness is not structurally valid yet and cannot be treated as runtime-ready.";
  }
}

function deriveRemediationSteps(readinessClass: ReadinessClass, runtimeReadinessIssues: string[]): string[] {
  if (readinessClass === "runtime_ready") {
    return [];
  }

  const remediation = new Set<string>();

  for (const issue of runtimeReadinessIssues) {
    if (issue === "Target directory does not exist") {
      remediation.add("Import the .harness package into the target directory before running verify.");
      continue;
    }
    if (issue === "No OpenClaw config file found") {
      remediation.add("Restore or regenerate openclaw.json before treating this import as runnable.");
      continue;
    }
    if (issue.startsWith("Workspace file missing:")) {
      remediation.add("Restore the required workspace instructions such as AGENTS.md, or re-export the source so the workspace contract is complete.");
      continue;
    }
    if (issue === "Config file appears invalid" || issue.startsWith("Could not parse config to validate binding semantics:")) {
      remediation.add("Repair openclaw.json to valid JSON/JSON5 and rerun import if rebinding did not complete cleanly.");
      continue;
    }
    if (issue.startsWith("Missing imported workspace:") || issue.startsWith("Missing bound workspace target ")) {
      remediation.add("Re-import the pack so all declared workspaces are materialized into the target directory.");
      continue;
    }
    if (issue.startsWith("Default workspace binding not rebound") || issue.startsWith("Agent ") && issue.includes("workspace binding not rebound")) {
      remediation.add("Re-import the pack so workspace bindings are rewritten into openclaw.json for the target path.");
      continue;
    }
    if (
      issue.startsWith("Manifest contract error:") ||
      issue === "Manifest placement contract missing or invalid" ||
      issue === "Manifest rebinding contract missing or invalid" ||
      issue.startsWith("Pack type contract error:")
    ) {
      remediation.add("Re-export the source with the current harness CLI so the imported manifest and pack-type contract are regenerated.");
      continue;
    }
    if (issue.includes("missing agent/ subdirectory")) {
      remediation.add("Re-import an instance pack if runtime agent state is required, or restore the expected agent/ subdirectory manually.");
      continue;
    }
  }

  if (remediation.size === 0) {
    remediation.add("Review the reported readiness issues and re-run import or export before treating the harness as runtime-ready.");
  }

  return [...remediation];
}

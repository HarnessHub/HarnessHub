import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";
import type { Manifest, VerifyResult, VerifyCheck } from "./types.js";
import { SCHEMA_VERSION } from "./types.js";
import { findConfigFile, resolveWorkspaceBindings } from "./scanner.js";

const REQUIRED_WORKSPACE_FILES = ["AGENTS.md"];

export function verify(targetDir: string, manifest?: Manifest): VerifyResult {
  const checks: VerifyCheck[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];
  const manifestWorkspaces = manifest?.workspaces ?? [];

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
    return { valid: false, checks, warnings, errors };
  }

  // Check 2: Config file exists
  const configPath = findConfigFile(targetDir);
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
  }

  // Check 3: Workspace directory exists
  const resolvedWorkspaces = resolveWorkspaceBindings(targetDir, configPath);
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
        }
      }
    } catch { /* ignore */ }
  }

  // Check 7: Manifest validation
  if (manifest) {
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
      }
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

  return { valid, checks, warnings, errors };
}

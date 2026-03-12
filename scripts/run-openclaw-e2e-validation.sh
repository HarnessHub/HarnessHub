#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SOURCE_DIR="${HARNESSHUB_OPENCLAW_E2E_SOURCE_DIR:-$HOME/.openclaw}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
RUN_DIR="${HARNESSHUB_OPENCLAW_E2E_RUN_DIR:-$ROOT_DIR/.artifacts/openclaw-e2e/$TIMESTAMP}"
PACK_FILE="$RUN_DIR/openclaw-template.harness"
TARGET_DIR="$RUN_DIR/imported"
REPORT_JSON="${HARNESSHUB_OPENCLAW_E2E_REPORT_JSON:-$ROOT_DIR/docs/validation/openclaw-e2e-validation.json}"
REPORT_MD="${HARNESSHUB_OPENCLAW_E2E_REPORT_MD:-$ROOT_DIR/docs/validation/openclaw-e2e-validation.md}"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "OpenClaw e2e validation failed: source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$RUN_DIR" "$(dirname "$REPORT_JSON")" "$(dirname "$REPORT_MD")"

npm run build >/dev/null

node dist/cli.js inspect -p "$SOURCE_DIR" -f json >"$RUN_DIR/inspect.json"
node dist/cli.js export -p "$SOURCE_DIR" -o "$PACK_FILE" -t template --allow-pack-type-override -f json >"$RUN_DIR/export.json"
node dist/cli.js import "$PACK_FILE" -t "$TARGET_DIR" -f json >"$RUN_DIR/import.json"
node dist/cli.js verify -p "$TARGET_DIR" -f json >"$RUN_DIR/verify.json"
tar -xOf "$PACK_FILE" manifest.json >"$RUN_DIR/manifest.json"
sha256sum "$PACK_FILE" >"$RUN_DIR/sha256.txt"

node - "$ROOT_DIR" "$SOURCE_DIR" "$RUN_DIR" "$REPORT_JSON" "$REPORT_MD" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [rootDir, sourceDir, runDir, reportJsonPath, reportMdPath] = process.argv.slice(2);
const inspect = JSON.parse(fs.readFileSync(path.join(runDir, "inspect.json"), "utf8"));
const exported = JSON.parse(fs.readFileSync(path.join(runDir, "export.json"), "utf8"));
const imported = JSON.parse(fs.readFileSync(path.join(runDir, "import.json"), "utf8"));
const verify = JSON.parse(fs.readFileSync(path.join(runDir, "verify.json"), "utf8"));
const manifest = JSON.parse(fs.readFileSync(path.join(runDir, "manifest.json"), "utf8"));
const sha256Line = fs.readFileSync(path.join(runDir, "sha256.txt"), "utf8").trim();
const sha256 = sha256Line.split(/\s+/)[0];
const artifactStat = fs.statSync(path.join(runDir, "openclaw-template.harness"));
const readableSourceDir = sourceDir.startsWith(process.env.HOME || "")
  ? sourceDir.replace(process.env.HOME, "~")
  : sourceDir;
const relativeRunDir = path.relative(rootDir, runDir) || ".";
const sanitizeText = (value) => String(value)
  .replaceAll(rootDir, ".")
  .replaceAll(runDir, relativeRunDir)
  .replaceAll(sourceDir, readableSourceDir);
const summary = {
  validatedAt: new Date().toISOString(),
  sourceDir: readableSourceDir,
  artifactPath: path.join(relativeRunDir, "openclaw-template.harness"),
  artifactSha256: sha256,
  artifactSizeBytes: artifactStat.size,
  inspect: {
    detected: inspect.detected,
    product: inspect.product,
    configPath: inspect.configPath ? path.basename(inspect.configPath) : null,
    recommendedPackType: inspect.recommendedPackType,
    riskAssessment: inspect.riskAssessment,
    workspaceDirs: inspect.structure?.workspaceDirs ?? [],
    workspaceFileCount: inspect.structure?.workspaceFiles?.length ?? 0,
    skillDirCount: inspect.structure?.skillDirs?.length ?? 0,
    agentIds: inspect.structure?.agentIds ?? [],
    warnings: (inspect.warnings ?? []).map(sanitizeText),
  },
  export: {
    success: exported.success,
    packId: exported.packId,
    packType: exported.packType,
    riskLevel: exported.riskLevel,
    fileCount: exported.fileCount,
    totalSize: exported.totalSize,
    policyWarnings: (exported.policyWarnings ?? []).map(sanitizeText),
  },
  manifest: {
    schemaVersion: manifest.schemaVersion,
    image: manifest.image,
    lineage: manifest.lineage,
    harness: manifest.harness,
    bindingWorkspaceCount: manifest.bindings?.workspaces?.length ?? 0,
    source: manifest.source,
  },
  import: {
    success: imported.success,
    targetDir: path.join(relativeRunDir, "imported"),
    fileCount: imported.fileCount,
    warnings: (imported.warnings ?? []).map(sanitizeText),
  },
  verify: {
    valid: verify.valid,
    readinessClass: verify.readinessClass,
    readinessSummary: sanitizeText(verify.readinessSummary ?? ""),
    runtimeReady: verify.runtimeReady,
    checkNames: (verify.checks ?? []).map((check) => check.name),
    runtimeReadinessIssues: (verify.runtimeReadinessIssues ?? []).map(sanitizeText),
    warnings: (verify.warnings ?? []).map(sanitizeText),
    errors: (verify.errors ?? []).map(sanitizeText),
  },
};

fs.writeFileSync(reportJsonPath, JSON.stringify(summary, null, 2) + "\n", "utf8");

const md = [
  "# OpenClaw End-to-End Validation",
  "",
  "This record comes from a real local `~/.openclaw` validation run using the current `harness` CLI path.",
  "",
  `- Validated at: \`${summary.validatedAt}\``,
  `- Source directory: \`${summary.sourceDir}\``,
  `- Artifact path: \`${summary.artifactPath}\``,
  `- Artifact sha256: \`${summary.artifactSha256}\``,
  `- Artifact size: \`${summary.artifactSizeBytes}\` bytes`,
  "",
  "## Inspect",
  "",
  `- Detected: \`${summary.inspect.detected}\``,
  `- Product: \`${summary.inspect.product}\``,
  `- Config file: \`${summary.inspect.configPath}\``,
  `- Recommended pack type: \`${summary.inspect.recommendedPackType}\``,
  `- Risk assessment: \`${summary.inspect.riskAssessment}\``,
  `- Workspace dirs: \`${summary.inspect.workspaceDirs.join(", ")}\``,
  `- Workspace file count: \`${summary.inspect.workspaceFileCount}\``,
  `- Skill dir count: \`${summary.inspect.skillDirCount}\``,
  `- Agent ids: \`${summary.inspect.agentIds.join(", ")}\``,
  "",
  "## Export",
  "",
  `- Success: \`${summary.export.success}\``,
  `- Pack ID: \`${summary.export.packId}\``,
  `- Pack type: \`${summary.export.packType}\``,
  `- Risk level: \`${summary.export.riskLevel}\``,
  `- File count: \`${summary.export.fileCount}\``,
  `- Total size: \`${summary.export.totalSize}\` bytes`,
  "",
  "## Export Policy",
  "",
  ...(summary.export.policyWarnings.length > 0
    ? summary.export.policyWarnings.map((warning) => `- ${warning}`)
    : ["- none"]),
  "",
  "## Manifest",
  "",
  `- Schema version: \`${summary.manifest.schemaVersion}\``,
  `- Adapter: \`${summary.manifest.image.adapter}\``,
  `- Image ID: \`${summary.manifest.image.imageId}\``,
  `- Binding workspace count: \`${summary.manifest.bindingWorkspaceCount}\``,
  `- Harness intent: \`${summary.manifest.harness.intent}\``,
  `- Harness target product: \`${summary.manifest.harness.targetProduct}\``,
  `- Harness components: \`${summary.manifest.harness.components.join(", ")}\``,
  "",
  "## Import And Verify",
  "",
  `- Import success: \`${summary.import.success}\``,
  `- Imported target: \`${summary.import.targetDir}\``,
  `- Imported file count: \`${summary.import.fileCount}\``,
  `- Verify valid: \`${summary.verify.valid}\``,
  `- Readiness class: \`${summary.verify.readinessClass}\``,
  `- Runtime ready: \`${summary.verify.runtimeReady}\``,
  `- Readiness summary: ${summary.verify.readinessSummary}`,
  `- Verify checks: \`${summary.verify.checkNames.join(", ")}\``,
  "",
  "## Warnings",
  "",
  ...(summary.inspect.warnings.length > 0 ? summary.inspect.warnings.map((warning) => `- Inspect: ${warning}`) : ["- Inspect: none"]),
  ...(summary.import.warnings.length > 0 ? summary.import.warnings.map((warning) => `- Import: ${warning}`) : ["- Import: none"]),
  ...(summary.verify.warnings.length > 0 ? summary.verify.warnings.map((warning) => `- Verify: ${warning}`) : ["- Verify: none"]),
  "",
  "The `.harness` artifact itself is retained only in the local `.artifacts/` directory and is intentionally not committed.",
  "",
];

fs.writeFileSync(reportMdPath, md.join("\n"), "utf8");
NODE

echo "OpenClaw e2e validation complete."
echo "Artifact: $PACK_FILE"
echo "Report:   $REPORT_MD"

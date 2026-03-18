#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

SOURCE_DIR="${HARNESSHUB_FRESH_OPERATOR_SOURCE_DIR:-$HOME/.openclaw}"
TIMESTAMP="$(date -u +"%Y%m%dT%H%M%SZ")"
RUN_DIR="${HARNESSHUB_FRESH_OPERATOR_RUN_DIR:-$ROOT_DIR/.artifacts/fresh-operator/$TIMESTAMP}"
INSTALL_ROOT="$RUN_DIR/install-root"
PACK_FILE="$RUN_DIR/openclaw-template.harness"
TARGET_DIR="$RUN_DIR/imported"
REPORT_JSON="${HARNESSHUB_FRESH_OPERATOR_REPORT_JSON:-$ROOT_DIR/docs/validation/fresh-operator-validation.json}"
REPORT_MD="${HARNESSHUB_FRESH_OPERATOR_REPORT_MD:-$ROOT_DIR/docs/validation/fresh-operator-validation.md}"
PACKAGE_SPEC="${HARNESSHUB_FRESH_OPERATOR_PACKAGE_SPEC:-}"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Fresh-operator validation failed: source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$RUN_DIR" "$INSTALL_ROOT" "$(dirname "$REPORT_JSON")" "$(dirname "$REPORT_MD")"

if [[ -z "$PACKAGE_SPEC" ]]; then
  npm pack --pack-destination "$RUN_DIR" >/dev/null
  PACKAGE_SPEC="$(find "$RUN_DIR" -maxdepth 1 -type f -name 'harnesshub-*.tgz' | head -n 1)"
fi

if [[ -z "$PACKAGE_SPEC" ]]; then
  echo "Fresh-operator validation failed: package spec could not be resolved." >&2
  exit 1
fi

npm install --prefix "$INSTALL_ROOT" "$PACKAGE_SPEC" >/dev/null

BIN_PATH="$INSTALL_ROOT/node_modules/.bin/harness"
if [[ ! -x "$BIN_PATH" ]]; then
  echo "Fresh-operator validation failed: installed harness binary not found: $BIN_PATH" >&2
  exit 1
fi

"$BIN_PATH" --version >"$RUN_DIR/version.txt"
"$BIN_PATH" inspect -p "$SOURCE_DIR" -f json >"$RUN_DIR/inspect.json"
"$BIN_PATH" export -p "$SOURCE_DIR" -o "$PACK_FILE" -t template --allow-pack-type-override -f json >"$RUN_DIR/export.json"
"$BIN_PATH" import "$PACK_FILE" -t "$TARGET_DIR" -f json >"$RUN_DIR/import.json"
"$BIN_PATH" verify -p "$TARGET_DIR" -f json >"$RUN_DIR/verify.json"
tar -xOf "$PACK_FILE" manifest.json >"$RUN_DIR/manifest.json"
sha256sum "$PACK_FILE" >"$RUN_DIR/sha256.txt"

node - "$ROOT_DIR" "$SOURCE_DIR" "$RUN_DIR" "$REPORT_JSON" "$REPORT_MD" "$PACKAGE_SPEC" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [rootDir, sourceDir, runDir, reportJsonPath, reportMdPath, packageSpec] = process.argv.slice(2);
const version = fs.readFileSync(path.join(runDir, "version.txt"), "utf8").trim();
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
const normalizedPackageSpec = packageSpec.startsWith(rootDir)
  ? packageSpec.replace(rootDir, ".")
  : packageSpec;

const summary = {
  validatedAt: new Date().toISOString(),
  packageSpec: normalizedPackageSpec,
  installedVersion: version,
  sourceDir: readableSourceDir,
  artifactPath: path.join(relativeRunDir, "openclaw-template.harness"),
  artifactSha256: sha256,
  artifactSizeBytes: artifactStat.size,
  inspect: {
    detected: inspect.detected,
    product: inspect.product,
    recommendedPackType: inspect.recommendedPackType,
    riskAssessment: inspect.riskAssessment,
    warnings: (inspect.warnings ?? []).map(sanitizeText),
  },
  export: {
    success: exported.success,
    packType: exported.packType,
    riskLevel: exported.riskLevel,
    policyWarnings: (exported.policyWarnings ?? []).map(sanitizeText),
  },
  manifest: {
    schemaVersion: manifest.schemaVersion,
    image: manifest.image,
    harness: manifest.harness,
  },
  import: {
    success: imported.success,
    warnings: (imported.warnings ?? []).map(sanitizeText),
  },
  verify: {
    valid: verify.valid,
    readinessClass: verify.readinessClass,
    readinessSummary: sanitizeText(verify.readinessSummary ?? ""),
    runtimeReady: verify.runtimeReady,
    warnings: (verify.warnings ?? []).map(sanitizeText),
    errors: (verify.errors ?? []).map(sanitizeText),
  },
};

fs.writeFileSync(reportJsonPath, JSON.stringify(summary, null, 2) + "\n", "utf8");

const md = [
  "# Fresh Operator Validation",
  "",
  "This record validates the documented operator flow through an isolated package install rather than through the repository working tree directly.",
  "",
  `- Validated at: \`${summary.validatedAt}\``,
  `- Package spec: \`${summary.packageSpec}\``,
  `- Installed version: \`${summary.installedVersion}\``,
  `- Source directory: \`${summary.sourceDir}\``,
  `- Artifact path: \`${summary.artifactPath}\``,
  `- Artifact sha256: \`${summary.artifactSha256}\``,
  `- Artifact size: \`${summary.artifactSizeBytes}\` bytes`,
  "",
  "## Inspect",
  "",
  `- Detected: \`${summary.inspect.detected}\``,
  `- Product: \`${summary.inspect.product}\``,
  `- Recommended pack type: \`${summary.inspect.recommendedPackType}\``,
  `- Risk assessment: \`${summary.inspect.riskAssessment}\``,
  "",
  "## Export",
  "",
  `- Success: \`${summary.export.success}\``,
  `- Pack type: \`${summary.export.packType}\``,
  `- Risk level: \`${summary.export.riskLevel}\``,
  "",
  "## Import And Verify",
  "",
  `- Import success: \`${summary.import.success}\``,
  `- Verify valid: \`${summary.verify.valid}\``,
  `- Readiness class: \`${summary.verify.readinessClass}\``,
  `- Runtime ready: \`${summary.verify.runtimeReady}\``,
  `- Readiness summary: ${summary.verify.readinessSummary}`,
  "",
  "## Warnings",
  "",
  ...(summary.inspect.warnings.length > 0 ? summary.inspect.warnings.map((warning) => `- Inspect: ${warning}`) : ["- Inspect: none"]),
  ...(summary.import.warnings.length > 0 ? summary.import.warnings.map((warning) => `- Import: ${warning}`) : ["- Import: none"]),
  ...(summary.verify.warnings.length > 0 ? summary.verify.warnings.map((warning) => `- Verify: ${warning}`) : ["- Verify: none"]),
  "",
  "This validation intentionally exercises the packaged CLI path instead of the repository-local `dist/` entrypoint.",
  "",
];

fs.writeFileSync(reportMdPath, md.join("\n"), "utf8");
NODE

echo "Fresh-operator validation complete."
echo "Package:  $PACKAGE_SPEC"
echo "Report:   $REPORT_MD"

export const SCHEMA_VERSION = "0.5.0";
export const HARNESS_DEFINITION_SCHEMA_VERSION = "0.2.0";
export const HARNESS_DEFINITION_FILE = "harness.definition.json";

export type PackType = "template" | "instance";

export type RiskLevel = "safe-share" | "internal-only" | "trusted-migration-only";

export type OutputFormat = "text" | "json";
export type HarnessAdapterId = "openclaw";

export interface Manifest {
  schemaVersion: string;
  packType: PackType;
  packId: string;
  createdAt: string;
  image: HarnessImageMetadata;
  lineage: HarnessImageLineage;
  placement: PlacementContract;
  rebinding: RebindingContract;
  bindings: BindingSemantics;
  harness: HarnessMetadata;
  source: {
    product: string;
    version: string;
    configPath: string;
  };
  includedPaths: string[];
  workspaces: WorkspaceBinding[];
  sensitiveFlags: SensitiveFlags;
  riskLevel: RiskLevel;
}

export type HarnessIntent = "agent-runtime-environment";

export interface HarnessImageMetadata {
  imageId: string;
  adapter: HarnessAdapterId;
}

export interface HarnessImageReference {
  imageId: string;
}

export interface HarnessDefinitionParentReference {
  refType: "image-id" | "path";
  value: string;
}

export interface HarnessImageLineage {
  parentImage: HarnessImageReference | null;
  layerOrder: string[];
}

export interface HarnessDefinitionLineage {
  parentImage: HarnessDefinitionParentReference | null;
  layerOrder: string[];
}

export interface PlacementContract {
  reservedRoots: string[];
  componentRoots: {
    config: string;
    workspace: string;
    workspaces: string;
    reports: string;
    state: string;
  };
  persistedManifestPath: string;
}

export interface RebindingContract {
  workspaceTargetMode: "absolute-path";
  mutableConfigTargets: string[];
}

export interface BindingSemantics {
  workspaces: WorkspaceBindingRule[];
}

export interface WorkspaceBindingRule {
  agentId: string;
  logicalPath: string;
  targetRelativePath: string;
  configTargets: string[];
  required: boolean;
}

export type HarnessComponent =
  | "workspace"
  | "config"
  | "skills"
  | "agents"
  | "credentials"
  | "sessions"
  | "memory"
  | "cron"
  | "hooks"
  | "extensions"
  | "logs"
  | "browser"
  | "completions";

export interface HarnessMetadata {
  intent: HarnessIntent;
  targetProduct: string;
  components: HarnessComponent[];
}

export interface HarnessDefinition {
  schemaVersion: string;
  kind: "harness-definition";
  image: HarnessImageMetadata;
  lineage: HarnessDefinitionLineage;
  harness: HarnessMetadata;
  bindings: BindingSemantics;
  rebinding: RebindingContract;
  source: HarnessDefinitionSource;
  verify: HarnessDefinitionVerifyIntent;
}

export interface HarnessDefinitionSource {
  bootstrap: "starter" | "openclaw-path";
  detectedProduct: string | null;
  configPath: string | null;
}

export interface HarnessDefinitionVerifyIntent {
  readinessTarget: ReadinessClass;
  expectedComponents: HarnessComponent[];
  requireWorkspaceBindings: boolean;
}

export interface WorkspaceBinding {
  agentId: string;
  logicalPath: string;
  packPath: string;
  isDefault: boolean;
}

export interface SensitiveFlags {
  hasCredentials: boolean;
  hasApiKeys: boolean;
  hasOAuthTokens: boolean;
  hasAuthProfiles: boolean;
  hasWhatsAppCreds: boolean;
  hasCopilotToken: boolean;
  hasSessions: boolean;
  hasMemoryDb: boolean;
  hasEnvFile: boolean;
}

export interface InspectResult {
  detected: boolean;
  stateDir: string;
  configPath: string | null;
  product: string;
  version: string | null;
  structure: InstanceStructure;
  sensitiveFlags: SensitiveFlags;
  recommendedPackType: PackType;
  riskAssessment: RiskLevel;
  warnings: string[];
  workflow?: InspectWorkflow;
}

export interface InspectWorkflow {
  recommendedExportCommand: string;
  recommendationSummary: string;
  overrideExportCommand?: string;
}

export interface InstanceStructure {
  hasConfig: boolean;
  hasWorkspace: boolean;
  hasSessions: boolean;
  hasMemory: boolean;
  hasCredentials: boolean;
  hasSkills: boolean;
  hasAgents: boolean;
  hasCron: boolean;
  hasHooks: boolean;
  hasExtensions: boolean;
  hasLogs: boolean;
  hasBrowser: boolean;
  hasCompletions: boolean;
  workspaceDirs: string[];
  workspaceFiles: string[];
  configFiles: string[];
  sessionFiles: string[];
  skillDirs: string[];
  agentIds: string[];
  cronJobs: string[];
}

export interface VerifyResult {
  valid: boolean;
  runtimeReady: boolean;
  readinessClass: ReadinessClass;
  readinessSummary: string;
  runtimeReadinessIssues: string[];
  remediationSteps: string[];
  checks: VerifyCheck[];
  warnings: string[];
  errors: string[];
}

export type ReadinessClass =
  | "runtime_ready"
  | "manual_steps_required"
  | "structurally_invalid";

export interface VerifyCheck {
  name: string;
  passed: boolean;
  message: string;
}

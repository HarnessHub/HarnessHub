import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import JSON5 from "json5";
import type {
  InstanceStructure,
  InspectResult,
  SensitiveFlags,
  RiskLevel,
  PackType,
  WorkspaceBinding,
} from "./types.js";

// Known product directory names (current + legacy)
const OPENCLAW_DIR_NAMES = ["openclaw", "clawdbot", "moldbot", "moltbot"];
const CONFIG_FILE_NAMES = ["openclaw.json", "clawdbot.json", "moldbot.json", "moltbot.json"];
const DEFAULT_AGENT_ID = "main";

const WORKSPACE_FILES = [
  "AGENTS.md", "SOUL.md", "TOOLS.md", "IDENTITY.md",
  "USER.md", "HEARTBEAT.md", "BOOTSTRAP.md", "MEMORY.md", "memory.md",
];

const SENSITIVE_PATTERNS = [
  /api[_-]?key/i,
  /token/i,
  /secret/i,
  /password/i,
  /credential/i,
];

export function resolveStateDir(customPath?: string): string {
  if (customPath) return path.resolve(customPath);
  if (process.env.OPENCLAW_STATE_DIR) return path.resolve(process.env.OPENCLAW_STATE_DIR);
  if (process.env.CLAWDBOT_STATE_DIR) return path.resolve(process.env.CLAWDBOT_STATE_DIR);

  const home = homedir();

  // Check legacy dirs first
  for (const name of OPENCLAW_DIR_NAMES.slice(1)) {
    const candidate = path.join(home, `.${name}`);
    if (fs.existsSync(candidate)) return candidate;
  }

  // Check profile variant (OPENCLAW_PROFILE env)
  const profile = process.env.OPENCLAW_PROFILE;
  if (profile && profile !== "default") {
    const profDir = path.join(home, `.openclaw-${profile}`);
    if (fs.existsSync(profDir)) return profDir;
  }

  // Default
  return path.join(home, ".openclaw");
}

export function findConfigFile(stateDir: string): string | null {
  if (process.env.OPENCLAW_CONFIG_PATH) {
    const p = path.resolve(process.env.OPENCLAW_CONFIG_PATH);
    return fs.existsSync(p) ? p : null;
  }
  if (process.env.CLAWDBOT_CONFIG_PATH) {
    const p = path.resolve(process.env.CLAWDBOT_CONFIG_PATH);
    return fs.existsSync(p) ? p : null;
  }
  for (const name of CONFIG_FILE_NAMES) {
    const candidate = path.join(stateDir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function normalizeAgentId(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_AGENT_ID;
  const trimmed = value.trim().toLowerCase();
  return trimmed || DEFAULT_AGENT_ID;
}

function resolveUserPath(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("~")) {
    return path.resolve(trimmed.replace(/^~(?=$|[\\/])/, homedir()));
  }
  return path.resolve(trimmed);
}

type ParsedConfig = {
  agents?: {
    defaults?: {
      workspace?: unknown;
    };
    list?: Array<{
      id?: unknown;
      default?: unknown;
      workspace?: unknown;
    }>;
  };
};

function readConfig(configPath: string | null): ParsedConfig | null {
  if (!configPath || !fs.existsSync(configPath)) return null;
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON5.parse(raw) as ParsedConfig;
  } catch {
    return null;
  }
}

function resolveDefaultAgentId(config: ParsedConfig | null): string {
  const list = config?.agents?.list;
  if (!Array.isArray(list) || list.length === 0) return DEFAULT_AGENT_ID;

  const defaultEntry = list.find((entry) => Boolean(entry && typeof entry === "object" && entry.default));
  return normalizeAgentId((defaultEntry ?? list[0])?.id);
}

function addWorkspaceBinding(
  bindings: Map<string, ResolvedWorkspaceBinding>,
  binding: ResolvedWorkspaceBinding
) {
  if (!fs.existsSync(binding.sourcePath)) return;
  bindings.set(binding.logicalPath, binding);
}

function toPackPath(logicalPath: string): string {
  return logicalPath === "workspace"
    ? "workspace"
    : path.posix.join("workspaces", logicalPath.slice("workspace-".length));
}

export interface ResolvedWorkspaceBinding extends WorkspaceBinding {
  sourcePath: string;
}

export function resolveWorkspaceBindings(stateDir: string, configPath: string | null): ResolvedWorkspaceBinding[] {
  const bindings = new Map<string, ResolvedWorkspaceBinding>();
  const config = readConfig(configPath);
  const defaultAgentId = resolveDefaultAgentId(config);
  const agentEntries = Array.isArray(config?.agents?.list) ? config!.agents!.list! : [];

  const addLogicalBinding = (params: {
    agentId: string;
    logicalPath: string;
    sourcePath: string;
    isDefault: boolean;
  }) => {
    addWorkspaceBinding(bindings, {
      agentId: params.agentId,
      logicalPath: params.logicalPath,
      packPath: toPackPath(params.logicalPath),
      sourcePath: params.sourcePath,
      isDefault: params.isDefault,
    });
  };

  const defaultAgentEntry = agentEntries.find(
    (entry) => normalizeAgentId(entry?.id) === defaultAgentId
  );
  const defaultWorkspace =
    typeof defaultAgentEntry?.workspace === "string"
      ? resolveUserPath(defaultAgentEntry.workspace)
      : typeof config?.agents?.defaults?.workspace === "string"
        ? resolveUserPath(config.agents.defaults.workspace)
        : path.join(stateDir, "workspace");
  addLogicalBinding({
    agentId: defaultAgentId,
    logicalPath: "workspace",
    sourcePath: defaultWorkspace,
    isDefault: true,
  });

  for (const entry of agentEntries) {
    const agentId = normalizeAgentId(entry?.id);
    if (agentId === defaultAgentId) continue;
    const configuredWorkspace =
      typeof entry?.workspace === "string"
        ? resolveUserPath(entry.workspace)
        : path.join(stateDir, `workspace-${agentId}`);
    addLogicalBinding({
      agentId,
      logicalPath: `workspace-${agentId}`,
      sourcePath: configuredWorkspace,
      isDefault: false,
    });
  }

  try {
    const entries = fs.readdirSync(stateDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === "workspace") {
        addLogicalBinding({
          agentId: defaultAgentId,
          logicalPath: "workspace",
          sourcePath: path.join(stateDir, entry.name),
          isDefault: true,
        });
        continue;
      }
      if (!entry.name.startsWith("workspace-")) continue;
      const agentId = normalizeAgentId(entry.name.slice("workspace-".length));
      addLogicalBinding({
        agentId,
        logicalPath: entry.name,
        sourcePath: path.join(stateDir, entry.name),
        isDefault: false,
      });
    }
  } catch {
    // best-effort
  }

  return [...bindings.values()].sort((a, b) => a.logicalPath.localeCompare(b.logicalPath));
}

function listFilesRecursive(dir: string, relativeTo: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(relativeTo, fullPath);
    if (entry.isFile()) {
      results.push(relPath);
    } else if (entry.isDirectory() && !entry.name.startsWith(".")) {
      results.push(...listFilesRecursive(fullPath, relativeTo));
    }
  }
  return results;
}

function scanWorkspace(
  bindings: ResolvedWorkspaceBinding[]
): { files: string[]; dirs: string[]; hasWorkspace: boolean } {
  if (bindings.length === 0) return { files: [], dirs: [], hasWorkspace: false };

  const files: string[] = [];
  for (const binding of bindings) {
    for (const name of WORKSPACE_FILES) {
      const absolute = path.join(binding.sourcePath, name);
      const logical = path.posix.join(binding.logicalPath, name);
      if (fs.existsSync(absolute) && !files.includes(logical)) {
        files.push(logical);
      }
    }
    const allFiles = listFilesRecursive(binding.sourcePath, binding.sourcePath);
    for (const relPath of allFiles) {
      const logical = path.posix.join(binding.logicalPath, relPath.split(path.sep).join("/"));
      if (!files.includes(logical)) {
        files.push(logical);
      }
    }
  }

  return {
    files,
    dirs: bindings.map((binding) => binding.logicalPath),
    hasWorkspace: bindings.length > 0,
  };
}

/** Scan agents/<agentId>/ directories */
function scanAgents(stateDir: string): string[] {
  const agentsDir = path.join(stateDir, "agents");
  if (!fs.existsSync(agentsDir)) return [];
  try {
    return fs.readdirSync(agentsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
  } catch { return []; }
}

/** Scan sessions from agents/<agentId>/sessions/*.jsonl */
function scanSessions(stateDir: string): string[] {
  const results: string[] = [];

  // New structure: agents/<agentId>/sessions/*.jsonl
  const agentsDir = path.join(stateDir, "agents");
  if (fs.existsSync(agentsDir)) {
    try {
      const agents = fs.readdirSync(agentsDir, { withFileTypes: true });
      for (const agent of agents) {
        if (!agent.isDirectory()) continue;
        const sessionsDir = path.join(agentsDir, agent.name, "sessions");
        if (!fs.existsSync(sessionsDir)) continue;
        const files = fs.readdirSync(sessionsDir)
          .filter(f => f.endsWith(".jsonl") || f === "sessions.json");
        for (const f of files) {
          results.push(path.join("agents", agent.name, "sessions", f));
        }
      }
    } catch { /* ignore */ }
  }

  // Legacy: root-level sessions-*.json5
  try {
    const rootFiles = fs.readdirSync(stateDir)
      .filter(f => f.startsWith("sessions-") && (f.endsWith(".json5") || f.endsWith(".json")));
    results.push(...rootFiles);
  } catch { /* ignore */ }

  return results;
}

function scanSkills(stateDir: string): string[] {
  const skillsDir = path.join(stateDir, "workspace", "skills");
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

/** Scan cron jobs */
function scanCron(stateDir: string): string[] {
  const cronStore = path.join(stateDir, "cron", "jobs.json");
  if (!fs.existsSync(cronStore)) return [];
  try {
    const content = fs.readFileSync(cronStore, "utf-8");
    const data = JSON.parse(content);
    if (Array.isArray(data)) return data.map((j: any) => j.id || j.name || "unknown");
    if (data && typeof data === "object") {
      return Object.keys(data).filter(k => k !== "_meta");
    }
  } catch { /* ignore */ }
  return ["(present)"];
}

function detectSensitiveContent(stateDir: string, configPath: string | null, agentIds: string[]): SensitiveFlags {
  const flags: SensitiveFlags = {
    hasCredentials: false,
    hasApiKeys: false,
    hasOAuthTokens: false,
    hasAuthProfiles: false,
    hasWhatsAppCreds: false,
    hasCopilotToken: false,
    hasSessions: false,
    hasMemoryDb: false,
    hasEnvFile: false,
  };

  // Check credentials/ directory
  const credDir = path.join(stateDir, "credentials");
  flags.hasCredentials = fs.existsSync(credDir);

  // Check oauth.json
  flags.hasOAuthTokens = fs.existsSync(path.join(credDir, "oauth.json"));

  // Check WhatsApp creds: credentials/whatsapp/*/creds.json
  const waDir = path.join(credDir, "whatsapp");
  if (fs.existsSync(waDir)) {
    try {
      const accounts = fs.readdirSync(waDir, { withFileTypes: true });
      flags.hasWhatsAppCreds = accounts.some(a =>
        a.isDirectory() && fs.existsSync(path.join(waDir, a.name, "creds.json"))
      );
    } catch { /* ignore */ }
  }

  // Check GitHub Copilot token
  flags.hasCopilotToken = fs.existsSync(path.join(credDir, "github-copilot.token.json"));

  // Check auth-profiles.json in each agent dir
  for (const agentId of agentIds) {
    const authProfiles = path.join(stateDir, "agents", agentId, "agent", "auth-profiles.json");
    if (fs.existsSync(authProfiles)) {
      flags.hasAuthProfiles = true;
      flags.hasCredentials = true;
      break;
    }
  }

  // Check sessions (both new and legacy)
  flags.hasSessions = scanSessions(stateDir).length > 0;

  // Check memory databases: memory/*.sqlite and agents/*/qmd/
  try {
    const memDir = path.join(stateDir, "memory");
    if (fs.existsSync(memDir)) {
      const memFiles = fs.readdirSync(memDir);
      flags.hasMemoryDb = memFiles.some(f =>
        f.endsWith(".db") || f.endsWith(".sqlite")
      );
    }
  } catch { /* ignore */ }

  if (!flags.hasMemoryDb) {
    // Also check root-level DB files (legacy)
    try {
      const rootFiles = fs.readdirSync(stateDir);
      flags.hasMemoryDb = rootFiles.some(f =>
        f.endsWith(".db") || f.endsWith(".sqlite") || f.endsWith(".lance")
      );
    } catch { /* ignore */ }
  }

  if (!flags.hasMemoryDb) {
    // Check agents/*/qmd/ for QMD index databases
    for (const agentId of agentIds) {
      const qmdDir = path.join(stateDir, "agents", agentId, "qmd");
      if (fs.existsSync(qmdDir)) {
        flags.hasMemoryDb = true;
        break;
      }
    }
  }

  // Check config for API keys
  if (configPath && fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      flags.hasApiKeys = SENSITIVE_PATTERNS.some(p => p.test(content));
    } catch { /* ignore */ }
  }

  // Check .env file
  flags.hasEnvFile = fs.existsSync(path.join(stateDir, ".env"));
  if (flags.hasEnvFile) {
    flags.hasApiKeys = true;
  }

  return flags;
}

function detectProductVersion(stateDir: string): string | null {
  const candidates = [
    path.join(stateDir, "..", "openclaw", "package.json"),
    path.join(stateDir, "version"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        if (candidate.endsWith("package.json")) {
          const pkg = JSON.parse(fs.readFileSync(candidate, "utf-8"));
          return pkg.version || null;
        }
        return fs.readFileSync(candidate, "utf-8").trim();
      } catch { /* ignore */ }
    }
  }
  return null;
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
  // template
  if (sensitive.hasApiKeys || sensitive.hasCredentials || sensitive.hasAuthProfiles) {
    return "internal-only";
  }
  return "safe-share";
}

export function inspect(customPath?: string): InspectResult {
  const stateDir = resolveStateDir(customPath);
  const exists = fs.existsSync(stateDir);
  const configPath = exists ? findConfigFile(stateDir) : null;
  const version = exists ? detectProductVersion(stateDir) : null;
  const workspaceBindings = exists ? resolveWorkspaceBindings(stateDir, configPath) : [];

  const workspace = exists
    ? scanWorkspace(workspaceBindings)
    : { files: [], dirs: [], hasWorkspace: false };
  const agentIds = exists ? scanAgents(stateDir) : [];
  const sessionFiles = exists ? scanSessions(stateDir) : [];
  const skillDirs = exists ? scanSkills(stateDir) : [];
  const cronJobs = exists ? scanCron(stateDir) : [];

  const sensitiveFlags = exists
    ? detectSensitiveContent(stateDir, configPath, agentIds)
    : {
        hasCredentials: false, hasApiKeys: false, hasOAuthTokens: false,
        hasAuthProfiles: false, hasWhatsAppCreds: false, hasCopilotToken: false,
        hasSessions: false, hasMemoryDb: false, hasEnvFile: false,
      };

  const configFiles: string[] = [];
  if (configPath) configFiles.push(path.basename(configPath));
  // Also detect config backups
  if (exists) {
    try {
      const rootFiles = fs.readdirSync(stateDir);
      for (const f of rootFiles) {
        if (f.match(/^(openclaw|clawdbot|moldbot|moltbot)\.json\.bak/)) {
          configFiles.push(f);
        }
      }
    } catch { /* ignore */ }
  }

  const structure: InstanceStructure = {
    hasConfig: configPath !== null,
    hasWorkspace: workspace.hasWorkspace,
    hasSessions: sessionFiles.length > 0,
    hasMemory: sensitiveFlags.hasMemoryDb,
    hasCredentials: sensitiveFlags.hasCredentials,
    hasSkills: skillDirs.length > 0,
    hasAgents: agentIds.length > 0,
    hasCron: cronJobs.length > 0,
    hasHooks: fs.existsSync(path.join(stateDir, "hooks")),
    hasExtensions: fs.existsSync(path.join(stateDir, "extensions")),
    hasLogs: fs.existsSync(path.join(stateDir, "logs")),
    hasBrowser: fs.existsSync(path.join(stateDir, "browser")),
    hasCompletions: fs.existsSync(path.join(stateDir, "completions")),
    workspaceDirs: workspace.dirs,
    workspaceFiles: workspace.files,
    configFiles,
    sessionFiles,
    skillDirs,
    agentIds,
    cronJobs,
  };

  const warnings: string[] = [];
  if (!exists) warnings.push(`State directory not found: ${stateDir}`);
  if (!configPath && exists) warnings.push("No OpenClaw config file found");
  if (!workspace.hasWorkspace && exists) warnings.push("No workspace directory found");
  if (sensitiveFlags.hasApiKeys) warnings.push("Config contains API keys or tokens");
  if (sensitiveFlags.hasAuthProfiles) warnings.push("Agent auth-profiles.json detected (contains API credentials)");
  if (sensitiveFlags.hasOAuthTokens) warnings.push("OAuth tokens detected in credentials/");
  if (sensitiveFlags.hasWhatsAppCreds) warnings.push("WhatsApp credentials detected");
  if (sensitiveFlags.hasCopilotToken) warnings.push("GitHub Copilot token cache detected");
  if (sensitiveFlags.hasCredentials) warnings.push("Credentials directory exists");
  if (sensitiveFlags.hasEnvFile) warnings.push(".env file detected");

  const hasSensitive = sensitiveFlags.hasCredentials || sensitiveFlags.hasOAuthTokens ||
    sensitiveFlags.hasSessions || sensitiveFlags.hasMemoryDb ||
    sensitiveFlags.hasAuthProfiles || sensitiveFlags.hasWhatsAppCreds ||
    sensitiveFlags.hasCopilotToken || sensitiveFlags.hasEnvFile;
  const recommendedPackType: PackType = hasSensitive ? "instance" : "template";
  const riskAssessment = assessRisk(sensitiveFlags, recommendedPackType);

  return {
    detected: exists && (configPath !== null || workspace.hasWorkspace),
    stateDir,
    configPath,
    product: "openclaw",
    version,
    structure,
    sensitiveFlags,
    recommendedPackType,
    riskAssessment,
    warnings,
  };
}

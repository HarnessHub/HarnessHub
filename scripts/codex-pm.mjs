#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const PM_ROOT = path.join(".codex", "pm");
const ISSUE_STATE_ROOT = path.join(PM_ROOT, "issue-state");
const VALID_STATUSES = ["backlog", "in_progress", "blocked", "done"];
const VALID_TASK_TYPES = ["implementation", "docs", "ops", "umbrella"];
const CLOSING_ISSUE_PATTERN = /\b(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#(\d+)\b/gi;
const GITHUB_REMOTE_PATTERN = /github\.com[:/]([^/]+)\/([^/.]+?)(?:\.git)?$/;

export function main(argv = process.argv.slice(2), io = console) {
  const [action, ...args] = argv;
  if (!action) {
    io.error("Usage: node scripts/codex-pm.mjs <action> [args]");
    return 1;
  }

  try {
    switch (action) {
      case "init":
        initPm();
        return 0;
      case "prd-new":
        return prdNew(args, io);
      case "epic-new":
        return epicNew(args, io);
      case "task-new":
        return taskNew(args, io);
      case "tasks":
        return listTasks(args, io);
      case "next":
        return nextTask(args, io);
      case "set-status":
        return setStatus(args, io);
      case "blocked":
        return blocked(args, io);
      case "issue-state-init":
        return issueStateInit(args, io);
      case "issue-state-show":
        return issueStateShow(args, io);
      case "issue-state-check":
        return issueStateCheck(args, io);
      case "delivery-state-check":
        return deliveryStateCheck(args, io);
      case "standup":
        return standup(args, io);
      case "issue-body":
        return issueBody(args, io);
      case "pr-body":
        return prBody(args, io);
      case "pr-create":
        return prCreate(args, io);
      case "issue-deliver":
        return issueDeliver(args, io);
      case "verify-pr-closure-sync":
        return verifyPrClosureSync(args, io);
      default:
        io.error(`Unknown action: ${action}`);
        return 1;
    }
  } catch (error) {
    io.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function initPm() {
  for (const name of ["prds", "epics", "tasks", "issue-state", "updates", "context"]) {
    fs.mkdirSync(path.join(PM_ROOT, name), { recursive: true });
  }
}

function prdNew(args, io) {
  const { positional, options } = parseArgs(args);
  const [slug] = positional;
  const title = options.title;
  requireValue(slug, "slug is required");
  requireValue(title, "--title is required");
  initPm();
  const prdPath = path.join(PM_ROOT, "prds", `${slug}.md`);
  writeDocument(prdPath, {
    type: "prd",
    slug,
    title,
    status: "draft",
  }, {
    Summary: "",
    Problem: "",
    Goals: "- ",
    "Non-Goals": "- ",
    "Success Criteria": "- ",
    Dependencies: "- ",
  });
  io.log(prdPath);
  return 0;
}

function epicNew(args, io) {
  const { positional, options } = parseArgs(args);
  const [slug] = positional;
  const title = options.title;
  requireValue(slug, "slug is required");
  requireValue(title, "--title is required");
  initPm();
  const metadata = {
    type: "epic",
    slug,
    title,
    status: "backlog",
  };
  if (options.prd) metadata.prd = options.prd;
  const epicPath = path.join(PM_ROOT, "epics", `${slug}.md`);
  writeDocument(epicPath, metadata, {
    Outcome: "",
    Scope: "- ",
    "Acceptance Criteria": "- ",
    "Child Issues": "- ",
    Notes: "",
  });
  io.log(epicPath);
  return 0;
}

function taskNew(args, io) {
  const { positional, options } = parseArgs(args);
  const [epic, slug] = positional;
  requireValue(epic, "epic is required");
  requireValue(slug, "slug is required");
  requireValue(options.title, "--title is required");
  validateEnum(options.status ?? "backlog", VALID_STATUSES, "--status");
  validateEnum(options["task-type"] ?? "implementation", VALID_TASK_TYPES, "--task-type");
  initPm();
  const taskPath = path.join(PM_ROOT, "tasks", epic, `${slug}.md`);
  const metadata = {
    type: "task",
    epic,
    slug,
    title: options.title,
    status: options.status ?? "backlog",
    task_type: options["task-type"] ?? "implementation",
    labels: options.labels ?? "",
    depends_on: options["depends-on"] ?? "",
  };
  if (options.issue) metadata.issue = options.issue;
  writeDocument(taskPath, metadata, buildTaskSections({
    title: options.title,
    issue: options.issue,
    issueBodyFile: options["issue-body-file"],
    repo: options.repo,
  }));
  io.log(taskPath);
  return 0;
}

function listTasks(args, io) {
  const { options } = parseArgs(args);
  const docs = loadTasks({ status: options.status, epic: options.epic });
  if (options.json) {
    io.log(JSON.stringify(docs.map(docToDict), null, 2));
    return 0;
  }
  for (const doc of docs) {
    const issue = doc.metadata.issue ? ` issue=${doc.metadata.issue}` : "";
    io.log(`${doc.path} status=${doc.metadata.status ?? "backlog"}${issue}`);
  }
  return 0;
}

function nextTask(args, io) {
  const { options } = parseArgs(args);
  const docs = loadTasks({ epic: options.epic }).filter((doc) => (doc.metadata.status ?? "backlog") === "backlog");
  if (docs.length === 0) {
    io.log(options.json ? "null" : "No backlog task found.");
    return 0;
  }
  const task = docs[0];
  io.log(options.json ? JSON.stringify(docToDict(task), null, 2) : task.path);
  return 0;
}

function setStatus(args, io) {
  const { positional, options } = parseArgs(args);
  const [filePath, status] = positional;
  requireValue(filePath, "path is required");
  requireValue(status, "status is required");
  validateEnum(status, VALID_STATUSES, "status");
  const document = readDocument(filePath);
  updateDocumentStatus(document, status, options.reason);
  io.log(document.path);
  return 0;
}

function blocked(args, io) {
  const { positional, options } = parseArgs(args);
  const [filePath] = positional;
  requireValue(filePath, "path is required");
  requireValue(options.reason, "--reason is required");
  const document = readDocument(filePath);
  updateDocumentStatus(document, "blocked", options.reason);
  io.log(document.path);
  return 0;
}

function issueStateInit(args, io) {
  const { positional } = parseArgs(args);
  const [filePath] = positional;
  requireValue(filePath, "path is required");
  const taskDocument = readDocument(filePath);
  const stateDocument = initIssueState(taskDocument);
  io.log(stateDocument.path);
  return 0;
}

function issueStateShow(args, io) {
  const { positional } = parseArgs(args);
  const [filePath] = positional;
  requireValue(filePath, "path is required");
  const taskDocument = readDocument(filePath);
  const stateDocument = loadIssueState(taskDocument);
  if (!stateDocument) {
    io.error("No issue state document found for task.");
    return 1;
  }
  io.log(stateDocument.path);
  io.log("");
  io.log(fs.readFileSync(stateDocument.path, "utf8").trimEnd());
  return 0;
}

function issueStateCheck(args, io) {
  const { options } = parseArgs(args);
  const branch = options.branch ?? currentBranch();
  const result = checkIssueState(branch);
  if (result === null) {
    io.log("Issue state check skipped: current branch is not issue-scoped.");
    return 0;
  }
  if (result.ok) {
    io.log(result.message);
    return 0;
  }
  io.error(result.message);
  return 1;
}

function deliveryStateCheck(args, io) {
  const { options } = parseArgs(args);
  const branch = options.branch ?? currentBranch();
  const allowReadyToDeliver = options["allow-ready-to-deliver"] === true;
  const result = checkDeliveryState(branch, { allowReadyToDeliver });
  if (result === null) {
    io.log("Delivery state check skipped: current branch is not issue-scoped.");
    return 0;
  }
  if (result.ok) {
    io.log(result.message);
    return 0;
  }
  io.error(result.message);
  return 1;
}

function standup(args, io) {
  const { options } = parseArgs(args);
  const summary = {
    backlog: [],
    in_progress: [],
    blocked: [],
    done: [],
  };
  for (const document of loadTasks({})) {
    const status = summary[document.metadata.status ?? "backlog"] ? (document.metadata.status ?? "backlog") : "backlog";
    summary[status].push(docToDict(document));
  }
  if (options.json) {
    io.log(JSON.stringify(summary, null, 2));
    return 0;
  }
  for (const status of VALID_STATUSES) {
    io.log(`${status}: ${summary[status].length}`);
    for (const item of summary[status]) {
      io.log(`  - ${item.title} (${item.path})`);
    }
  }
  return 0;
}

function issueBody(args, io) {
  const { positional } = parseArgs(args);
  const [filePath] = positional;
  requireValue(filePath, "path is required");
  const document = readDocument(filePath);
  io.log(renderIssueBody(document));
  return 0;
}

function prBody(args, io) {
  const { positional, options } = parseArgs(args);
  const [filePath] = positional;
  requireValue(filePath, "path is required");
  const document = readDocument(filePath);
  const tests = asArray(options.tests);
  const issue = options.issue ? Number(options.issue) : undefined;
  io.log(renderPrBody(document, { issue, tests }));
  return 0;
}

function prCreate(args, io) {
  const { positional, options } = parseArgs(args);
  const [filePath] = positional;
  requireValue(filePath, "path is required");
  const document = readDocument(filePath);
  const tests = asArray(options.tests);
  const issue = options.issue ? Number(options.issue) : undefined;
  const prUrl = createPr(document, {
    issue,
    tests,
    title: options.title,
    baseRepo: options["base-repo"] ?? inferBaseRepo() ?? "HarnessHub/HarnessHub",
    baseBranch: options["base-branch"] ?? "main",
    headOwner: options["head-owner"],
    headBranch: options["head-branch"],
  });
  io.log(prUrl);
  return 0;
}

function issueDeliver(args, io) {
  const { positional, options } = parseArgs(args);
  const [filePath] = positional;
  requireValue(filePath, "path is required");
  const document = readDocument(filePath);
  if ((document.metadata.type ?? "") !== "task") {
    throw new Error(`issue delivery requires a task document: ${filePath}`);
  }
  const issue = options.issue ? Number(options.issue) : parseIssueNumber(document.metadata.issue ?? "");
  if (issue === null) {
    throw new Error("issue delivery requires a numeric issue reference on the task or via --issue");
  }
  if ((document.metadata.task_type ?? "implementation") === "umbrella") {
    throw new Error("issue delivery does not support task_type=umbrella");
  }
  if ((document.metadata.status ?? "") !== "done") {
    throw new Error(`issue delivery requires the task to be status=done: ${document.path}`);
  }
  const branch = options["head-branch"] ?? currentBranch();
  if (!branch) throw new Error("issue delivery requires a current branch");
  const branchIssue = parseIssueFromBranch(branch);
  if (branchIssue !== null && branchIssue !== issue) {
    throw new Error(`issue delivery branch mismatch: branch ${branch} targets issue #${branchIssue}, task is issue #${issue}`);
  }

  const pushCommand = options["push-command"] ?? `git push -u origin ${branch}`;
  runShellCommand(options["review-command"] ?? "npm run review:checkpoint", "review checkpoint");
  runShellCommand(options["preflight-command"] ?? "HARNESSHUB_PREFLIGHT_ALLOW_READY_TO_DELIVER=1 ./scripts/run-agent-preflight.sh", "agent preflight");
  runShellCommand(pushCommand, "push");

  const tests = asArray(options.tests);
  const baseRepo = options["base-repo"] ?? inferBaseRepo() ?? "HarnessHub/HarnessHub";
  const baseBranch = options["base-branch"] ?? "main";
  const headOwner = options["head-owner"];
  const prUrl = findOpenPrForBranch({
    baseRepo,
    headOwner,
    headBranch: branch,
  }) ?? createPr(document, {
    issue,
    tests,
    title: options.title,
    baseRepo,
    baseBranch,
    headOwner,
    headBranch: branch,
  });
  markDeliveryStage(document, "pr_opened", { prUrl });
  commitDeliveryState(document, `Record PR-opened delivery state for issue #${issue}`);
  runShellCommand(pushCommand, "push");
  io.log(prUrl);
  return 0;
}

function verifyPrClosureSync(args, io) {
  const { options } = parseArgs(args);
  const prBody = resolvePrBody(options);
  const changedFiles = resolveChangedFiles(options);
  const errors = verifyClosureSync(prBody, changedFiles);
  if (errors.length > 0) {
    for (const error of errors) {
      io.error(error);
    }
    return 1;
  }
  io.log("PR task closure sync passed.");
  return 0;
}

export function parseArgs(args) {
  const positional = [];
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const key = token.slice(2);
    const next = args[index + 1];
    if (next === undefined || next.startsWith("--")) {
      options[key] = true;
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      const current = options[key];
      options[key] = Array.isArray(current) ? [...current, next] : [current, next];
    } else {
      options[key] = next;
    }
    index += 1;
  }
  return { positional, options };
}

function writeDocument(filePath, metadata, sections) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  persistDocument({ path: filePath, metadata: { ...metadata }, sections: { ...sections } });
}

export function persistDocument(document) {
  const lines = ["---"];
  for (const [key, value] of Object.entries(document.metadata)) {
    if (value) lines.push(`${key}: ${value}`);
  }
  lines.push("---", "");
  for (const [heading, body] of Object.entries(document.sections)) {
    lines.push(`## ${heading}`, "");
    if (body) lines.push(...String(body).replace(/\s+$/u, "").split("\n"));
    lines.push("");
  }
  fs.writeFileSync(document.path, `${lines.join("\n").replace(/\n+$/u, "\n")}`, "utf8");
}

export function readDocument(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  if (!text.startsWith("---\n")) {
    throw new Error(`document missing frontmatter: ${filePath}`);
  }
  const parts = text.split("---\n");
  const frontmatter = parts[1] ?? "";
  const body = parts.slice(2).join("---\n");
  const metadata = {};
  for (const line of frontmatter.trim().split("\n")) {
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  const sections = {};
  let currentHeading = null;
  let currentLines = [];
  for (const line of body.split("\n")) {
    if (line.startsWith("## ")) {
      if (currentHeading) sections[currentHeading] = currentLines.join("\n").trim();
      currentHeading = line.slice(3).trim();
      currentLines = [];
      continue;
    }
    if (currentHeading) currentLines.push(line);
  }
  if (currentHeading) sections[currentHeading] = currentLines.join("\n").trim();
  return { path: String(filePath), metadata, sections };
}

export function loadTasks({ status, epic }) {
  const base = path.join(PM_ROOT, "tasks");
  if (!fs.existsSync(base)) return [];
  const results = [];
  for (const epicDir of fs.readdirSync(base, { withFileTypes: true })) {
    if (!epicDir.isDirectory()) continue;
    if (epic && epicDir.name !== epic) continue;
    const fullEpic = path.join(base, epicDir.name);
    for (const entry of fs.readdirSync(fullEpic, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      const document = readDocument(path.join(fullEpic, entry.name));
      if (status && document.metadata.status !== status) continue;
      results.push(document);
    }
  }
  return sortTasks(results);
}

function sortTasks(documents) {
  return [...documents].sort((left, right) => {
    const leftIssue = Number.parseInt(left.metadata.issue ?? "999999", 10);
    const rightIssue = Number.parseInt(right.metadata.issue ?? "999999", 10);
    return (
      compare(left.metadata.epic ?? "", right.metadata.epic ?? "") ||
      compare(statusRank(left.metadata.status ?? "backlog"), statusRank(right.metadata.status ?? "backlog")) ||
      compare(Number.isNaN(leftIssue) ? 999999 : leftIssue, Number.isNaN(rightIssue) ? 999999 : rightIssue) ||
      compare(left.metadata.title ?? "", right.metadata.title ?? "") ||
      compare(left.path, right.path)
    );
  });
}

function statusRank(status) {
  const index = VALID_STATUSES.indexOf(status);
  return index === -1 ? VALID_STATUSES.length : index;
}

export function docToDict(document) {
  return {
    path: document.path,
    title: document.metadata.title ?? "",
    status: document.metadata.status ?? "",
    epic: document.metadata.epic ?? "",
    issue: document.metadata.issue ?? undefined,
    state_path: document.metadata.state_path ?? undefined,
    delivery_stage: document.metadata.delivery_stage ?? undefined,
    pr_url: document.metadata.pr_url ?? undefined,
    task_type: document.metadata.task_type ?? "implementation",
    labels: (document.metadata.labels ?? "").split(",").map((item) => item.trim()).filter(Boolean),
  };
}

function updateDocumentStatus(document, status, reason) {
  document.metadata.status = status;
  if (reason) {
    document.metadata.status_reason = reason;
  } else {
    delete document.metadata.status_reason;
  }
  persistDocument(document);
  syncLinkedIssueStateStatus(document);
}

function issueStatePath(document) {
  const issue = parseIssueNumber(document.metadata.issue ?? "");
  if (issue === null) throw new Error(`task has no numeric issue reference: ${document.path}`);
  const slug = document.metadata.slug ?? path.basename(document.path, ".md");
  return path.join(ISSUE_STATE_ROOT, `${issue}-${slug}.md`);
}

export function initIssueState(taskDocument) {
  const filePath = issueStatePath(taskDocument);
  if (!fs.existsSync(filePath)) {
    writeDocument(filePath, {
      type: "issue_state",
      issue: taskDocument.metadata.issue ?? "",
      task: taskDocument.path,
      title: taskDocument.metadata.title ?? "",
      status: taskDocument.metadata.status ?? "",
      delivery_stage: defaultDeliveryStage(taskDocument),
    }, buildIssueStateSections(taskDocument));
  }
  taskDocument.metadata.state_path = filePath;
  persistDocument(taskDocument);
  return readDocument(filePath);
}

function loadIssueState(taskDocument) {
  const candidates = [];
  if (taskDocument.metadata.state_path) candidates.push(taskDocument.metadata.state_path);
  try {
    candidates.push(issueStatePath(taskDocument));
  } catch {
    // ignore
  }
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return readDocument(candidate);
  }
  return null;
}

function syncLinkedIssueStateStatus(taskDocument) {
  if ((taskDocument.metadata.type ?? "") !== "task") return;
  const stateDocument = loadIssueState(taskDocument);
  if (!stateDocument) return;
  stateDocument.metadata.status = taskDocument.metadata.status ?? "";
  stateDocument.metadata.delivery_stage = defaultDeliveryStage(taskDocument);
  delete stateDocument.metadata.pr_url;
  persistDocument(stateDocument);
}

function markDeliveryStage(taskDocument, stage, { prUrl } = {}) {
  const stateDocument = loadIssueState(taskDocument);
  if (!stateDocument) return;
  stateDocument.metadata.status = taskDocument.metadata.status ?? "";
  stateDocument.metadata.delivery_stage = stage;
  if (prUrl) {
    stateDocument.metadata.pr_url = prUrl;
  } else if (stage !== "pr_opened") {
    delete stateDocument.metadata.pr_url;
  }
  persistDocument(stateDocument);
}

function commitDeliveryState(taskDocument, message) {
  const stateDocument = loadIssueState(taskDocument);
  if (!stateDocument) return;
  const diff = spawnSync("git", ["diff", "--quiet", "--", stateDocument.path], { encoding: "utf8" });
  if (diff.status === 0) return;
  const addResult = spawnSync("git", ["add", stateDocument.path], { encoding: "utf8" });
  if (addResult.status !== 0) {
    throw new Error((addResult.stderr || addResult.stdout || `git add failed for ${stateDocument.path}`).trim());
  }
  const commitResult = spawnSync("git", ["commit", "-m", message], { encoding: "utf8" });
  if (commitResult.status !== 0) {
    throw new Error((commitResult.stderr || commitResult.stdout || "git commit failed").trim());
  }
}

function checkIssueState(branch) {
  const issue = parseIssueFromBranch(branch);
  if (issue === null) return null;
  const task = findTaskByIssue(issue);
  if (!task) {
    return { ok: false, message: `Issue state check failed: no task twin found for issue #${issue}.` };
  }
  if ((task.metadata.status ?? "backlog") !== "in_progress") {
    return { ok: true, message: `Issue state check skipped: task for issue #${issue} is not in progress.` };
  }
  const stateDocument = loadIssueState(task);
  if (!stateDocument) {
    return {
      ok: false,
      message: `Issue state check failed: in-progress issue has no state document. Run \`node scripts/codex-pm.mjs issue-state-init ${task.path}\`.`,
    };
  }
  if ((stateDocument.metadata.status ?? "") !== (task.metadata.status ?? "")) {
    return {
      ok: false,
      message: `Issue state check failed: task and issue-state status differ for issue #${issue}. Task=${task.metadata.status ?? ""} issue-state=${stateDocument.metadata.status ?? ""}.`,
    };
  }
  return { ok: true, message: `Issue state check passed: ${stateDocument.path}` };
}

function checkDeliveryState(branch, { allowReadyToDeliver = false } = {}) {
  const issue = parseIssueFromBranch(branch);
  if (issue === null) return null;
  const task = findTaskByIssue(issue);
  if (!task) {
    return { ok: false, message: `Delivery state check failed: no task twin found for issue #${issue}.` };
  }
  if ((task.metadata.status ?? "backlog") !== "done") {
    return { ok: true, message: `Delivery state check skipped: task for issue #${issue} is not done.` };
  }
  const stateDocument = loadIssueState(task);
  const statePath = stateDocument?.path ?? task.metadata.state_path ?? issueStatePath(task);
  const stage = stateDocument?.metadata.delivery_stage ?? defaultDeliveryStage(task);
  if (stage === "pr_opened") {
    return { ok: true, message: `Delivery state check passed: issue #${issue} is already at pr_opened.` };
  }
  const openPrUrl = findOpenPrForBranch({
    baseRepo: inferBaseRepo() ?? "HarnessHub/HarnessHub",
    headBranch: branch,
  });
  if (openPrUrl) {
    if (stateDocument && (stateDocument.metadata.pr_url ?? "") !== openPrUrl) {
      stateDocument.metadata.pr_url = openPrUrl;
      stateDocument.metadata.delivery_stage = "pr_opened";
      persistDocument(stateDocument);
    }
    return { ok: true, message: `Delivery state check passed: issue #${issue} already has an open PR.` };
  }
  if (allowReadyToDeliver) {
    return { ok: true, message: `Delivery state check allowed: issue #${issue} is ready_to_deliver without an open PR because the current flow is about to create one.` };
  }
  return {
    ok: false,
    message: `Delivery state check failed: issue #${issue} is done but still has no open PR. Current delivery stage is ${stage} (${statePath}). Use \`node scripts/codex-pm.mjs issue-deliver ${task.path} --issue ${issue} --tests "npm test"\`.`,
  };
}

function findTaskByIssue(issue) {
  return loadTasks({}).find((document) => parseIssueNumber(document.metadata.issue ?? "") === issue) ?? null;
}

export function renderIssueBody(document) {
  const lines = [];
  for (const heading of ["Context", "Deliverable", "Scope", "Acceptance Criteria"]) {
    const body = document.sections[heading];
    if (!body) continue;
    lines.push(`## ${heading}`, body, "");
  }
  if (document.metadata.task_type) {
    lines.push("## Task Type", document.metadata.task_type, "");
  }
  if (document.metadata.labels) {
    lines.push("## Labels", document.metadata.labels, "");
  }
  return lines.join("\n").trimEnd();
}

export function renderPrBody(document, { issue, tests }) {
  const lines = [];
  const taskType = document.metadata.task_type ?? "implementation";
  const closingIssue = issue ?? parseIssueNumber(document.metadata.issue ?? "");
  if (closingIssue !== null && closingIssue !== undefined && taskType !== "umbrella") {
    lines.push(`Closes #${closingIssue}`, "");
  }
  if (document.sections.Deliverable) {
    lines.push(document.sections.Deliverable, "");
  }
  if (document.sections["Implementation Notes"]) {
    lines.push("Implementation notes:", document.sections["Implementation Notes"], "");
  }
  const renderedTests = [];
  if (document.sections.Validation) {
    for (const line of document.sections.Validation.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "-") continue;
      renderedTests.push(line);
    }
  }
  for (const test of tests ?? []) renderedTests.push(`- \`${test}\``);
  if (renderedTests.length > 0) {
    lines.push("Validation:", ...renderedTests);
  }
  return lines.join("\n").trimEnd();
}

function createPr(document, { issue, tests, title, baseRepo, baseBranch, headOwner, headBranch }) {
  const branch = headBranch ?? currentBranch();
  if (!branch) throw new Error("PR creation failed: current branch is unavailable.");
  const originUrl = gitOutput(["remote", "get-url", "origin"]);
  const derivedOwner = headOwner ?? parseGithubRemote(originUrl)?.owner;
  if (!derivedOwner) {
    throw new Error("PR creation failed: could not derive the fork owner from origin. Pass --head-owner explicitly.");
  }
  const upstream = parseGithubRemote(gitOutput(["remote", "get-url", "upstream"]));
  if (upstream) {
    const inferred = `${upstream.owner}/${upstream.repo}`;
    if (inferred !== baseRepo) {
      throw new Error(`PR creation failed: upstream remote points to ${inferred}, not ${baseRepo}.`);
    }
  }
  const body = renderPrBody(document, { issue, tests });
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "harnesshub-pr-body-"));
  const bodyPath = path.join(tempDir, "pr-body.md");
  fs.writeFileSync(bodyPath, body, "utf8");
  try {
    const result = spawnSync("gh", [
      "pr", "create",
      "--repo", baseRepo,
      "--base", baseBranch,
      "--head", `${derivedOwner}:${branch}`,
      "--title", title ?? document.metadata.title ?? path.basename(document.path, ".md"),
      "--body-file", bodyPath,
    ], { encoding: "utf8" });
    if (result.status !== 0) {
      const failureOutput = (result.stderr || result.stdout || "gh pr create failed").trim();
      const existingPrUrl = failureOutput.match(/https:\/\/github\.com\/[^\s]+\/pull\/\d+/)?.[0];
      if (existingPrUrl) {
        return existingPrUrl;
      }
      throw new Error(failureOutput);
    }
    return result.stdout.trim();
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function findOpenPrForBranch({ baseRepo, headOwner, headBranch }) {
  const branch = headBranch ?? currentBranch();
  if (!branch) return null;
  const originUrl = gitOutput(["remote", "get-url", "origin"]);
  const derivedOwner = headOwner ?? parseGithubRemote(originUrl)?.owner;
  if (!derivedOwner) return null;
  const result = spawnSync("gh", [
    "pr", "list",
    "--repo", baseRepo,
    "--head", `${derivedOwner}:${branch}`,
    "--state", "open",
    "--json", "url",
  ], { encoding: "utf8" });
  if (result.status !== 0) return null;
  try {
    const pulls = JSON.parse(result.stdout);
    return Array.isArray(pulls) && pulls.length > 0 ? pulls[0].url ?? null : null;
  } catch {
    return null;
  }
}

export function verifyClosureSync(prBody, changedFiles) {
  const closingIssues = [...prBody.matchAll(CLOSING_ISSUE_PATTERN)].map((match) => Number.parseInt(match[1], 10));
  if (closingIssues.length === 0) return [];
  const taskDocuments = changedFiles
    .filter((filePath) => filePath.startsWith(".codex/pm/tasks/") && filePath.endsWith(".md") && fs.existsSync(filePath))
    .map((filePath) => readDocument(filePath));
  const errors = [];
  for (const issue of [...new Set(closingIssues)]) {
    const matching = taskDocuments.filter((document) => parseIssueNumber(document.metadata.issue ?? "") === issue);
    if (matching.length === 0) {
      errors.push(`PR closes #${issue} but does not update the matching local task file under .codex/pm/tasks/.`);
      continue;
    }
    const umbrella = matching.filter((document) => (document.metadata.task_type ?? "implementation") === "umbrella");
    if (umbrella.length > 0) {
      errors.push(`PR closes #${issue} but matching task file is task_type=umbrella and must remain open: ${umbrella.map((doc) => doc.path).join(", ")}`);
      continue;
    }
    if (!matching.some((document) => document.metadata.status === "done")) {
      errors.push(`PR closes #${issue} but matching task file is not marked done: ${matching.map((doc) => doc.path).join(", ")}`);
      continue;
    }
    for (const document of matching) {
      const stateDocument = loadIssueState(document);
      if (!stateDocument) continue;
      if ((stateDocument.metadata.status ?? "") !== (document.metadata.status ?? "")) {
        errors.push(`PR closes #${issue} but linked issue-state status does not match task status: ${stateDocument.path} is ${stateDocument.metadata.status ?? ""}, task is ${document.metadata.status ?? ""}.`);
      }
    }
  }
  return errors;
}

function buildTaskSections({ title, issue, issueBodyFile, repo }) {
  const hydrated = hydrateTaskFromIssue({ issue, issueBodyFile, repo });
  const contextParts = [hydrated.Summary, hydrated.Why].filter(Boolean);
  return {
    Context: contextParts.join("\n\n"),
    Deliverable: hydrated.Summary || title || "",
    Scope: asBulletList(hydrated.Scope),
    "Acceptance Criteria": asBulletList(hydrated["Acceptance Criteria"]),
    Validation: "- ",
    "Implementation Notes": "",
  };
}

function buildIssueStateSections(taskDocument) {
  const context = taskDocument.sections.Context || taskDocument.sections.Deliverable || taskDocument.metadata.title || "";
  return {
    Summary: context || "Record the current working state for this issue so later sessions do not have to rediscover it.",
    "Validated Facts": asBulletList(taskDocument.sections["Acceptance Criteria"]),
    "Open Questions": "- ",
    "Next Steps": asBulletList(taskDocument.sections.Scope),
    Artifacts: "- ",
  };
}

function defaultDeliveryStage(taskDocument) {
  switch (taskDocument.metadata.status ?? "backlog") {
    case "done":
      return "ready_to_deliver";
    case "blocked":
      return "blocked";
    case "in_progress":
      return "implementing";
    case "backlog":
    default:
      return "backlog";
  }
}

function resolvePrBody(options) {
  if (options["pr-body"]) return options["pr-body"];
  if (options["event-path"]) {
    const event = JSON.parse(fs.readFileSync(options["event-path"], "utf8"));
    return event.pull_request?.body ?? "";
  }
  throw new Error("either --pr-body or --event-path is required");
}

function resolveChangedFiles(options) {
  if (options["changed-file"]) return asArray(options["changed-file"]);
  if (options["base-sha"] && options["head-sha"]) {
    const result = spawnSync("git", ["diff", "--name-only", options["base-sha"], options["head-sha"]], { encoding: "utf8" });
    if (result.status !== 0) throw new Error((result.stderr || result.stdout || "git diff failed").trim());
    return result.stdout.split("\n").map((line) => line.trim()).filter(Boolean);
  }
  throw new Error("either --changed-file or both --base-sha and --head-sha are required");
}

function hydrateTaskFromIssue({ issue, issueBodyFile, repo }) {
  if (issueBodyFile) {
    return parseIssueSections(fs.readFileSync(issueBodyFile, "utf8"));
  }
  const issueNumber = parseIssueNumber(String(issue ?? ""));
  if (issueNumber === null) {
    return {};
  }
  const issueBody = loadGithubIssueBody(issueNumber, repo);
  return issueBody ? parseIssueSections(issueBody) : {};
}

function loadGithubIssueBody(issueNumber, repo) {
  const resolvedRepo = repo ?? inferBaseRepo();
  const args = ["issue", "view", String(issueNumber), "--json", "body"];
  if (resolvedRepo) args.push("--repo", resolvedRepo);
  const result = spawnSync("gh", args, { encoding: "utf8" });
  if (result.status !== 0) {
    return "";
  }
  try {
    return JSON.parse(result.stdout).body ?? "";
  } catch {
    return "";
  }
}

function parseIssueSections(markdown) {
  const sections = {};
  let currentHeading = null;
  const currentLines = [];
  const flush = () => {
    if (!currentHeading) return;
    sections[currentHeading] = currentLines.join("\n").trim();
    currentLines.length = 0;
  };
  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) {
      flush();
      currentHeading = line.slice(3).trim();
      continue;
    }
    if (currentHeading) currentLines.push(line);
  }
  flush();
  return sections;
}

function asBulletList(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "- ";
  return trimmed;
}

function runShellCommand(command, label) {
  const result = spawnSync("bash", ["-lc", command], { encoding: "utf8" });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${label} failed${output ? `: ${output}` : ""}`);
  }
}

function currentBranch() {
  return gitOutput(["branch", "--show-current"]) ?? "";
}

function inferBaseRepo() {
  const upstream = parseGithubRemote(gitOutput(["remote", "get-url", "upstream"]));
  return upstream ? `${upstream.owner}/${upstream.repo}` : null;
}

function gitOutput(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function parseGithubRemote(remote) {
  if (!remote) return null;
  const match = remote.match(GITHUB_REMOTE_PATTERN);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

function parseIssueFromBranch(branch) {
  const match = branch.match(/\bissue-(\d+)\b/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function parseIssueNumber(value) {
  return /^\d+$/.test(value) ? Number.parseInt(value, 10) : null;
}

function requireValue(value, message) {
  if (!value) throw new Error(message);
}

function validateEnum(value, allowed, label) {
  if (!allowed.includes(value)) {
    throw new Error(`${label} must be one of: ${allowed.join(", ")}`);
  }
}

function compare(left, right) {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function asArray(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main());
}

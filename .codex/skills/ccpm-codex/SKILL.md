---
name: ccpm-codex
description: Use when work in this repository should follow an issue-task-PR workflow with local task twins, issue state, and repository-local PR body generation.
---

# CCPM For Codex

Use this skill for project-management work in this repository when the task involves PRDs, epics, task decomposition, issue-scoped execution, or PR body generation.

## Workflow

1. Initialize the local PM workspace if `.codex/pm/` is missing:
   - `node scripts/codex-pm.mjs init`
2. Create or update planning documents:
   - PRD: `node scripts/codex-pm.mjs prd-new <slug> --title "<title>"`
   - Epic: `node scripts/codex-pm.mjs epic-new <slug> --title "<title>" --prd <prd-slug>`
   - Task: `node scripts/codex-pm.mjs task-new <epic> <slug> --title "<title>" --issue <n> --labels feature,test`
3. Treat each task file as the local twin of one GitHub issue.
4. Keep task status in sync with branch and PR state:
   - start work: `node scripts/codex-pm.mjs set-status <task-path> in_progress`
   - blocked: `node scripts/codex-pm.mjs blocked <task-path> --reason "..."`
   - merged: `node scripts/codex-pm.mjs set-status <task-path> done`
5. Initialize issue-scoped state for work that may span sessions:
   - `node scripts/codex-pm.mjs issue-state-init <task-path>`
6. Generate GitHub text from the task file:
   - issue body: `node scripts/codex-pm.mjs issue-body <task-path>`
   - PR body: `node scripts/codex-pm.mjs pr-body <task-path> --issue <n> --tests "npm test"`
   - PR creation: `node scripts/codex-pm.mjs pr-create <task-path> --tests "npm test"`

## Repository Rules

- One issue per branch.
- One issue per PR.
- Always branch from the latest `upstream/main`.
- Use `Closes #<issue>` in the PR body for non-umbrella tasks.
- Do not append commits to a branch whose PR has already been merged.


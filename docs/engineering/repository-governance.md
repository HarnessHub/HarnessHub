# Repository Governance

## Purpose

HarnessHub uses a repository-local harness so development work stays issue-scoped, reviewable, and repeatable.

This document explains the normal daily workflow for contributors and coding agents working in this repository.

## Core Rules

- One issue per branch.
- One issue per pull request.
- Start each issue branch from the latest commit on its target integration line.
- Default target integration line: `upstream/main`.
- Use `upstream/release/x.y` only for issues that belong to an active stable release line.
- Do not continue work on a branch whose pull request has already merged.
- Keep local task twins under `.codex/pm/tasks/` in sync with the GitHub issue they represent.

For the stable-branch model and the relationship between `main` and `release/x.y`, see:

- `docs/engineering/branching-and-release-governance.md`

## Daily Workflow

1. Start from the latest commit on the target integration line.
2. Create or confirm the matching GitHub issue.
3. Create or update the local task twin under `.codex/pm/tasks/`.
4. Move the task to `in_progress`.
5. Initialize issue-state if the work may span multiple sessions.
6. Implement the issue on its dedicated branch only.
7. Run the local review checkpoint.
8. Update `.codex-review` with real findings and remaining risks.
9. Run local preflight.
10. Use the repo-local delivery path to push the branch and open one pull request that closes the matching issue.

## Local PM Workflow

Use the repository-local PM commands rather than ad hoc notes:

```bash
node scripts/codex-pm.mjs init
node scripts/codex-pm.mjs task-new <epic> <slug> --title "<title>" --issue <n>
node scripts/codex-pm.mjs set-status <task-path> in_progress
node scripts/codex-pm.mjs issue-state-init <task-path>
node scripts/codex-pm.mjs set-status <task-path> done
node scripts/codex-pm.mjs issue-deliver <task-path> --issue <n> --tests "npm test"
node scripts/codex-pm.mjs pr-body <task-path> --issue <n>
```

The task file is the local twin of the GitHub issue. For longer work, the issue-state file holds validated facts, open questions, next steps, and artifacts so later sessions do not need to reconstruct them. When a task already has an issue-state document, `set-status` keeps the linked issue-state status in sync so closure checks cannot land with stale local state. `issue-deliver` is the default last-mile path once the task is `done`: it refreshes the review checkpoint, relies on a real review note, runs preflight, pushes the branch, and opens or reuses the PR.

## Review And Preflight

Before push, use:

```bash
./scripts/run-codex-review-checkpoint.sh
./scripts/run-agent-preflight.sh
```

The review checkpoint creates or refreshes:

- `.codex-review`
- `.codex-review-proof`

These files are local branch artifacts and should remain untracked in normal development.

Preflight checks:

- branch freshness against `upstream/main`
- review note and proof coherence
- issue-state readiness and task/status coherence
- delivery completeness for done issue branches that still have no open PR
- build and test execution
- local PR closure sync when the current PR body is available through `gh`

Coverage reporting is tracked separately from preflight. Use `npm run test:coverage` when you need a local coverage readout, and rely on the GitHub coverage workflow for the PR-visible summary and uploaded HTML report.

## When To Run Smoke Validation

Run:

```bash
./scripts/run-cli-smoke.sh
```

when a change affects the documented command path or import/export/verify behavior in a way that should be confirmed end-to-end.

For routine documentation-only changes, smoke validation is usually unnecessary unless the docs claim a behavior change.

## Temporary Local Artifacts

The following files are local-only and should not normally be committed:

- `.codex-review`
- `.codex-review-proof`

Everything under `.codex/pm/` is repository-local workflow state and may be committed when it is part of the tracked issue/task history.

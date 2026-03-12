---
name: harness-issue-execution
description: Use for issue-scoped delivery work in this repository so the session follows the correct sequence for branch setup, task twin sync, review proof timing, preflight, PR creation, and merge.
---

# Harness Issue Execution

Use this skill when implementing one specific GitHub issue in HarnessHub.

Do not use this skill for broad planning or for chaining several issues in one session.

## Goal

Keep issue execution fast without relying on memory for repository workflow details.

## Workflow

1. Confirm the issue number and work only on that one issue.
2. Start from the latest `upstream/main`.
3. Create or switch to the dedicated issue branch:
   - `issue-<n>-<slug>`
4. Create or update the local task twin under `.codex/pm/tasks/`.
5. Move the task to `in_progress`.
6. Initialize issue-state when the work may span sessions.
7. Implement only the scoped issue changes on that branch.
8. Commit the issue changes before refreshing review proof.
9. Refresh the review checkpoint:
   - `npm run review:checkpoint`
10. Update `.codex-review` with real findings and make sure `head reviewed:` still matches the current HEAD.
11. Run local preflight:
   - `./scripts/run-agent-preflight.sh`
12. Push the branch.
13. Open one PR that closes that issue only.
14. Merge the PR.
15. Stop using that branch after merge.

## Timing Rules

- Do not refresh `.codex-review-proof` before the issue commit exists.
- Do not run preflight until `.codex-review` has real review content and `head reviewed:` matches the current HEAD.
- Do not create the PR before the branch has been pushed and is visible on the remote.

## Branch Rules

- One issue per branch.
- One issue per PR.
- Do not continue work on a branch whose PR already merged.
- If the current branch already has a merged PR, stop and create a new issue branch from `upstream/main`.

## CCPM Rules

- Keep the local task twin aligned with the remote issue.
- Keep issue-state useful for handoff: validated facts, open questions, next steps, artifacts.
- Mark the task `done` only when the issue branch is ready to land.

## Validation Rules

- Use `./scripts/run-cli-smoke.sh` when the issue changes documented command paths or import/export/verify behavior.
- Keep preflight as the final local gate before PR creation or push.

## Not This Skill

- For repeated workflow failures that should become guardrails, use `harness-gap-closure`.
- For broader task and PRD management, use `ccpm-codex`.

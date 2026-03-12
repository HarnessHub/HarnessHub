---
type: task
epic: repository-harness
slug: block-continued-work-on-branches-whose-pr-has-already-merged
title: Block continued work on branches whose PR has already merged
status: done
task_type: implementation
labels: tooling,guardrail
issue: 38
state_path: .codex/pm/issue-state/38-block-continued-work-on-branches-whose-pr-has-already-merged.md
---

## Context

Add a local harness guardrail that blocks continued work on a branch once its associated pull request has already merged.

A merged issue branch should be treated as closed delivery state, but it is still easy to keep making changes locally and only realize the mistake later. That creates cleanup work, risks mixed-scope commits, and weakens the one-issue-per-branch rule.

## Deliverable

Add a local harness guardrail that blocks continued work on a branch once its associated pull request has already merged.

## Scope

- detect when the current issue branch already has a merged pull request
- surface the failure early in local harness flow rather than after more work accumulates
- keep the solution repository-local and compatible with the current issue-task-PR workflow

## Acceptance Criteria

- local harness flow blocks continued delivery work on branches whose PR has already merged
- the failure message makes the next correct action obvious
- the guardrail remains local and does not change public product behavior

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-agent-preflight.sh`

## Implementation Notes

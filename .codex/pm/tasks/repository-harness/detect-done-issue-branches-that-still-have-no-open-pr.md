---
type: task
epic: repository-harness
slug: detect-done-issue-branches-that-still-have-no-open-pr
title: Detect done issue branches that still have no open PR
status: done
task_type: implementation
labels: bug,harness,workflow
issue: 73
state_path: .codex/pm/issue-state/73-detect-done-issue-branches-that-still-have-no-open-pr.md
---

## Context

Add a repo-local guardrail for the state where an issue-scoped branch is already `done` locally but still has no open pull request.

`issue-deliver` now provides the default last-mile path from completed implementation to pushed PR, but there is still a detectable drift case worth hardening separately:

- the task is already `done`
- the branch still has local delivery activity
- there is no open PR for that issue branch yet

That state usually means the session stopped short of the intended completion condition, or a later session resumed on the branch without noticing that delivery is incomplete.

## Deliverable

Add a repo-local guardrail for the state where an issue-scoped branch is already `done` locally but still has no open pull request.

## Scope

- define the smallest reliable place to detect a `done` issue branch that still has no open PR
- decide whether that condition should be a hard failure, a gated preflight failure, or a strong standup warning
- add regression coverage for the no-open-PR drift case
- update workflow docs if the operator-facing behavior changes

## Acceptance Criteria

- the local harness can detect when an issue-scoped task is `done` but the branch still has no open PR
- the behavior is explicit and tested, not left to agent memory
- a fresh session gets a clear signal that delivery is incomplete in that state
- docs and skills reflect the strengthened rule if the user-facing flow changes

## Validation

-

## Implementation Notes

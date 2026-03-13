---
type: task
epic: repository-harness
slug: close-local-issue-state-drift-when-issue-tasks-are-marked-done
title: Close local issue-state drift when issue tasks are marked done
status: done
task_type: implementation
labels: bug,harness,test
issue: 69
state_path: .codex/pm/issue-state/69-close-local-issue-state-drift-when-issue-tasks-are-marked-done.md
---

## Context

Close the local harness gap where PR/task closure sync enforces `.codex/pm/tasks/*` status but leaves `.codex/pm/issue-state/*` stale.

Recent merged issues `#60`, `#61`, `#62`, and `#67` reached `task.status=done` and were merged into `upstream/main`, but their local `issue-state` docs still showed `in_progress` or `backlog`.

The current harness already blocks pushes when a PR closes an issue but the matching task file is not marked `done`. It does **not**:

- update the matching `issue-state` status when `set-status ... done` is called
- fail closure sync when the matching `issue-state` status disagrees with the task
- provide a repo-local command to finalize both task and issue-state together

That leaves the local PM model internally inconsistent even when the guarded PR flow succeeds.

## Deliverable

Close the local harness gap where PR/task closure sync enforces `.codex/pm/tasks/*` status but leaves `.codex/pm/issue-state/*` stale.

## Scope

- decide the smallest reliable place to enforce task and issue-state status coherence
- add a guardrail so closing an issue cannot leave a stale issue-state status behind
- add regression coverage for the drift case
- update workflow guidance if the operator-facing command changes

## Acceptance Criteria

- marking an issue task done cannot leave a linked issue-state document at `backlog` or `in_progress`
- closure sync or another repo-local guardrail fails when task and issue-state status disagree for a closing issue
- regression tests cover the stale issue-state case
- contributor guidance reflects the intended finalize flow

## Validation

-

## Implementation Notes

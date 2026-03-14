---
type: task
epic: repository-harness
slug: close-local-issue-state-drift-after-merged-or-closed-issues
title: Close local issue-state drift after merged or closed issues
status: done
task_type: implementation
labels: guardrail,pm
issue: 75
state_path: .codex/pm/issue-state/75-close-local-issue-state-drift-after-merged-or-closed-issues.md
---

## Context

Merged pull requests and closed GitHub issues can still leave their linked local `.codex/pm/issue-state/*.md` files at `status: in_progress`.

This creates false signals about repository progress and makes local PM state inconsistent with the actual remote issue lifecycle.

## Deliverable

Merged pull requests and closed GitHub issues can still leave their linked local `.codex/pm/issue-state/*.md` files at `status: in_progress`.

This creates false signals about repository progress and makes local PM state inconsistent with the actual remote issue lifecycle.

## Scope

-

## Acceptance Criteria

-

## Validation

-

## Implementation Notes

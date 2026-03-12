---
type: task
epic: repository-harness
slug: add-repo-local-skill-for-multi-issue-delivery-sessions
title: Add repo-local skill for multi-issue delivery sessions
status: done
task_type: implementation
labels: tooling,feature
issue: 31
state_path: .codex/pm/issue-state/31-add-repo-local-skill-for-multi-issue-delivery-sessions.md
---

## Context

When one session delivers several issues in a row, the repeated failure mode is not product logic. It is workflow drift: continuing on a merged branch, forgetting to resync from upstream, or letting issue scopes bleed together.


## Deliverable

Add a repo-local skill that explains how to sequence several issue branches safely in one session.


## Scope

- create a repository-local skill for multi-issue delivery sessions
- encode when to return to latest `upstream/main` and when to start a fresh branch
- keep the guidance aligned with the one-issue-per-branch rule

## Acceptance Criteria

- the repository has a dedicated skill for multi-issue delivery sequencing
- the skill explicitly prevents merged-branch reuse and stale-base continuation
- the guidance stays workflow-focused rather than changing product code

## Validation

- manual review against the repository governance and issue-branch rules

## Implementation Notes

Keep this skill separate from single-issue execution so the guidance stays narrow and composable.

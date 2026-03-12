---
type: task
epic: repository-harness
slug: document-harness-governance
title: Document repository harness governance and daily workflow
status: done
task_type: docs
labels: docs,tooling
issue: 7
state_path: .codex/pm/issue-state/7-document-harness-governance.md
---

## Context

The repository now has issue-task-PR tooling, hooks, preflight, and smoke validation, but the contributor-facing daily workflow is still fragmented across files.

## Deliverable

Add clear repository governance and daily workflow documentation for using the HarnessHub harness from issue start to merged PR.

## Scope

- document one-issue-per-branch and one-issue-per-PR rules
- document when to initialize issue-state, run preflight, and run CLI smoke
- document which local artifacts are temporary and should not be committed

## Acceptance Criteria

- one clear daily harness workflow is documented
- the guidance matches the repository scripts and hooks
- the docs stay HarnessHub-specific and avoid OpenPrecedent research framing

## Validation

- manual doc review against repository scripts

## Implementation Notes

Prefer one concise governance path rather than scattering the same rules across multiple docs.

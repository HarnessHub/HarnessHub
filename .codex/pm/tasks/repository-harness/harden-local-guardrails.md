---
type: task
epic: repository-harness
slug: harden-local-guardrails
title: Harden local harness guardrails for everyday use
status: done
task_type: implementation
labels: feature,tooling,test
issue: 5
state_path: .codex/pm/issue-state/5-harden-local-guardrails.md
---

## Context

The initial harness bootstrap is merged, but the day-to-day local workflow still needs a small hardening pass so review artifacts and guardrail behavior are cleaner in normal use.

## Deliverable

Tighten the local harness by ignoring review artifacts in Git and extending guardrail coverage for merged-branch and stale-proof behavior.

## Scope

- ignore `.codex-review` and `.codex-review-proof` in Git
- extend pre-push guardrail coverage for merged branch reuse
- extend pre-push guardrail coverage for stale review proof mismatch

## Acceptance Criteria

- local review artifacts do not show up as normal untracked files
- pre-push tests cover merged branch reuse and stale proof mismatch
- local harness docs remain accurate after the changes

## Validation

- `npm test`
- `./scripts/run-agent-preflight.sh`

## Implementation Notes

Keep the work in HarnessHub's repository-local harness; do not pull in extra OpenPrecedent-specific workflow layers.

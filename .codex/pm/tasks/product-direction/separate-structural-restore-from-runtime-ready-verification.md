---
type: task
epic: product-direction
slug: separate-structural-restore-from-runtime-ready-verification
title: Separate structural restore from runtime-ready verification
status: done
task_type: implementation
labels: feature,design
issue: 45
state_path: .codex/pm/issue-state/45-separate-structural-restore-from-runtime-ready-verification.md
---

## Context

Split verification semantics so HarnessHub can distinguish between a structurally restored import and a runtime-ready environment.

The real OpenClaw artifact now passes verify while still surfacing warnings that imply the imported result may not be fully runtime-ready. That makes the current `valid` signal too coarse. HarnessHub should make its verification contract more explicit.

## Deliverable

Split verification semantics so HarnessHub can distinguish between a structurally restored import and a runtime-ready environment.

## Scope

- define at least two verification levels: structural restore and runtime readiness
- update verify reporting so users can tell whether an image merely restored correctly or is actually ready for runtime use
- keep the initial implementation aligned with the current OpenClaw-oriented MVP

## Acceptance Criteria

- verify output can distinguish structural success from runtime readiness
- current warnings that imply incomplete runtime readiness are reflected in the verification model
- the new model improves product clarity without requiring a second runtime adapter yet

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-agent-preflight.sh`

## Implementation Notes

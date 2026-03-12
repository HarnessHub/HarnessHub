---
type: task
epic: product-direction
slug: migrate-format-layer-to-harness
title: Migrate package format naming from .clawpack to .harness
status: done
task_type: implementation
labels: feature,docs,test
issue: 19
state_path: .codex/pm/issue-state/19-migrate-format-layer-to-harness.md
---

## Context

The repository has already renamed the product and CLI to HarnessHub and `harness`, but the portable package format and imported sidecar names still expose legacy `.clawpack` naming in code, docs, and tests.


## Deliverable

Rename the archive extension, sidecar manifest naming, temporary import/export paths, and user-facing format references from `.clawpack` to `.harness`.


## Scope

- rename the portable archive extension from `.clawpack` to `.harness`
- rename persisted sidecar manifest and internal temporary paths away from `.clawpack-*`
- update default output names, command help text, docs, scripts, and tests
- remove old-format compatibility branches because the project has not shipped yet

## Acceptance Criteria

- the primary archive format is `.harness`
- the primary imported sidecar manifest name no longer uses `.clawpack-*`
- docs and tests use the new format naming consistently
- validation passes after the migration

## Validation

- `npm run build`
- `npm test`
- `npm run smoke`

## Implementation Notes

This issue is format-layer cleanup only. Historical references in archived PRD material may remain when they are explicitly describing the pre-rename phase.

---
type: task
epic: product-direction
slug: make-export-and-verify-lineage-aware-for-composed-v0-2-0-images
title: Make export and verify lineage-aware for composed v0.2.0 images
status: in_progress
task_type: implementation
issue: 109
state_path: .codex/pm/issue-state/109-make-export-and-verify-lineage-aware-for-composed-v0-2-0-images.md
---

## Context

Extend the existing export/import/verify lifecycle so it understands the first composed-image semantics introduced in v0.2.0.

## Deliverable

Extend the existing export/import/verify lifecycle so it understands the first composed-image semantics introduced in v0.2.0.

## Scope

- allow export to operate on definition/composed local results, not only raw runtime snapshots
- keep import behavior compatible with v0.1.x images
- make verify check operational lineage semantics instead of only field presence
- report parent reference, layer ordering, and composed materialization expectations clearly

## Acceptance Criteria

- export works for the supported v0.2.0 composed flow
- import remains backward compatible with existing v0.1.x images
- verify distinguishes lineage-aware success from lineage declaration/materialization failures
- tests cover single-image compatibility and composed-image verification cases

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-cli-smoke.sh`

## Implementation Notes

- compose now persists a resolved `harness.definition.json` snapshot into the materialized output so later lifecycle steps can recover lineage semantics without the original repo-relative parent path
- export now auto-discovers a definition snapshot from the source path when no explicit or cwd definition is present
- verify now consumes optional definition metadata in addition to pack manifests and reports `definition_contract`, `lineage_declaration`, and `lineage_materialization` checks
- added regression coverage for composed export discovery, lineage-aware verify success, lineage materialization failure, and invalid lineage declaration handling

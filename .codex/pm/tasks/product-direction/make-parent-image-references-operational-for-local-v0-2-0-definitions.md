---
type: task
epic: product-direction
slug: make-parent-image-references-operational-for-local-v0-2-0-definitions
title: Make parent image references operational for local v0.2.0 definitions
status: done
task_type: implementation
issue: 107
state_path: .codex/pm/issue-state/107-make-parent-image-references-operational-for-local-v0-2-0-definitions.md
---

## Context

Turn reserved lineage metadata into a real local parent-image mechanism for v0.2.0.

## Deliverable

Turn reserved lineage metadata into a real local parent-image mechanism for v0.2.0.

## Scope

- define how a v0.2.0 definition/image references one local parent image
- support local path or local image identity references only
- validate the reference shape in the definition and manifest layers
- keep remote lookup and registry naming out of scope

## Acceptance Criteria

- parent image references are documented and validated
- one parent/base reference can be declared in local definitions
- exported image metadata carries the declared local lineage coherently
- tests cover valid and invalid local parent reference cases

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-cli-smoke.sh`

## Implementation Notes

- Added operational local parent references in definitions via `image-id` or `path`.
- Resolved local path-based parent references to exported manifest `imageId` lineage during export.
- Strengthened definition and manifest lineage validation for the one-parent `0.2.0` shape.

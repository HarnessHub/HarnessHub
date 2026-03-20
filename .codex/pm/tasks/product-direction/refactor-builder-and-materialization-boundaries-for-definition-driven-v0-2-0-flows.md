---
type: task
epic: product-direction
slug: refactor-builder-and-materialization-boundaries-for-definition-driven-v0-2-0-flows
title: Refactor builder and materialization boundaries for definition-driven v0.2.0 flows
status: in_progress
task_type: implementation
issue: 108
state_path: .codex/pm/issue-state/108-refactor-builder-and-materialization-boundaries-for-definition-driven-v0-2-0-flows.md
---

## Context

Restructure the current internals so definition-driven and composed-image flows do not overload the v0.1.x snapshot path.

## Deliverable

Restructure the current internals so definition-driven and composed-image flows do not overload the v0.1.x snapshot path.

## Scope

- separate definition/composition concerns from adapter-specific snapshot inspection
- make builder, materializer, and verifier boundaries clearer for v0.2.0
- preserve current OpenClaw-first behavior while reducing internal coupling

## Acceptance Criteria

- definition/composition code paths are not hidden inside OpenClaw-only logic
- builder/materializer responsibilities are clearer in code structure
- the refactor does not regress the v0.1.x lifecycle
- tests keep existing OpenClaw packaging behavior intact while covering the new seams

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-cli-smoke.sh`

## Implementation Notes

- added `src/core/builder.ts` to hold shared image/lineage/binding/placement contract builders that were previously embedded inside `packer.ts`
- added `src/core/materialization.ts` to hold shared restore and workspace-rebinding helpers used by import, compose, and the OpenClaw adapter
- updated `packer.ts`, `compose.ts`, and `adapters/openclaw.ts` to consume the shared seams instead of keeping duplicate low-level materialization logic
- preserved the existing OpenClaw-first lifecycle and verification behavior while making definition-driven and composed flows depend on explicit shared modules

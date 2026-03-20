---
type: issue_state
issue: 108
task: .codex/pm/tasks/product-direction/refactor-builder-and-materialization-boundaries-for-definition-driven-v0-2-0-flows.md
title: Refactor builder and materialization boundaries for definition-driven v0.2.0 flows
status: in_progress
delivery_stage: implementing
---

## Summary

Restructure the current internals so definition-driven and composed-image flows do not overload the v0.1.x snapshot path.

## Validated Facts

- definition/composition code paths are not hidden inside OpenClaw-only logic
- builder/materializer responsibilities are clearer in code structure
- the refactor does not regress the v0.1.x lifecycle
- tests keep existing OpenClaw packaging behavior intact while covering the new seams
- image, lineage, binding, and placement builders now live in a shared core module instead of inside `packer.ts`
- import restore and workspace rebinding now use shared materialization helpers instead of separate compose versus import implementations
- the OpenClaw adapter still owns adapter-specific integration, but no longer owns the core rebinding implementation details

## Open Questions

-

## Next Steps

- commit, review-checkpoint, preflight, and deliver the branch
- after merge, the split `0.2.0` implementation issues are complete

## Artifacts

- `src/core/builder.ts`
- `src/core/materialization.ts`
- `src/core/packer.ts`
- `src/core/compose.ts`
- `src/core/adapters/openclaw.ts`

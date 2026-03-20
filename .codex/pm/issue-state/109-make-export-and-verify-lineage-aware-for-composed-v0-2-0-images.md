---
type: issue_state
issue: 109
task: .codex/pm/tasks/product-direction/make-export-and-verify-lineage-aware-for-composed-v0-2-0-images.md
title: Make export and verify lineage-aware for composed v0.2.0 images
status: in_progress
delivery_stage: implementing
---

## Summary

Extend the existing export/import/verify lifecycle so it understands the first composed-image semantics introduced in v0.2.0.

## Validated Facts

- export works for the supported v0.2.0 composed flow
- import remains backward compatible with existing v0.1.x images
- verify distinguishes lineage-aware success from lineage declaration/materialization failures
- tests cover single-image compatibility and composed-image verification cases
- composed outputs now persist a resolved definition snapshot with an image-id parent reference
- export can recover lineage from a composed source path even when the caller is outside the original definition repo
- verify can validate lineage semantics from either a pack manifest or a local definition snapshot

## Open Questions

-

## Next Steps

- commit, review-checkpoint, preflight, and deliver the branch
- after merge, continue with `#108`

## Artifacts

- `src/core/compose.ts`
- `src/core/packer.ts`
- `src/core/verifier.ts`
- `src/commands/verify.ts`
- `docs/specs/0003-v0-2-0-local-compose-materialization.md`
- `test/e2e.test.ts`
- `test/cli-integration.test.ts`
- `test/command-entrypoints.test.ts`

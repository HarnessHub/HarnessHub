---
type: issue_state
issue: 24
task: .codex/pm/tasks/product-direction/evolve-manifest-into-explicit-harness-image-contract.md
title: Evolve manifest into explicit Harness image contract
status: done
delivery_stage: ready_to_deliver
---

## Summary

Evolve the manifest from a simple export record into a clearer harness image contract with explicit image identity and reserved lineage metadata.

## Validated Facts

- the manifest already drives import and verify behavior in the MVP
- image identity was still implicit in `packId` rather than modeled explicitly
- parent and layer lineage needed reserved schema space before later composition work

## Open Questions

- none

## Next Steps

- none; ready for PR

## Artifacts

- issue #24
- `src/core/types.ts`
- `src/core/packer.ts`
- `src/core/verifier.ts`
- `test/e2e.test.ts`

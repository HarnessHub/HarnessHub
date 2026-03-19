---
type: issue_state
issue: 107
task: .codex/pm/tasks/product-direction/make-parent-image-references-operational-for-local-v0-2-0-definitions.md
title: Make parent image references operational for local v0.2.0 definitions
status: done
delivery_stage: pr_opened
pr_url: https://github.com/HarnessHub/HarnessHub/pull/114
---

## Summary

Turn reserved lineage metadata into a real local parent-image mechanism for v0.2.0.

## Validated Facts

- parent image references are documented and validated
- one parent/base reference can be declared in local definitions
- exported image metadata carries the declared local lineage coherently
- tests cover valid and invalid local parent reference cases
- `harness init` now supports `--parent-image-id` and `--parent-path`
- path-based parent references are resolved to a concrete parent `imageId` before export writes `manifest.json`

## Open Questions

-

## Next Steps

- self-review the issue diff
- commit the issue changes
- refresh review proof and deliver the PR

## Artifacts

- `src/core/definition.ts`
- `src/core/manifest.ts`
- `src/core/packer.ts`
- `docs/specs/0002-v0-2-0-harness-definition-file-specification.md`

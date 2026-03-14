---
type: issue_state
issue: 19
task: .codex/pm/tasks/product-direction/migrate-format-layer-to-harness.md
title: Migrate package format naming from .clawpack to .harness
status: done
delivery_stage: ready_to_deliver
---

## Summary

Complete the final format-layer rename so the shipped archive format, imported sidecar, and related temp paths all use HarnessHub naming rather than legacy ClawPack naming.

## Validated Facts

- issue #17 already renamed the product and primary CLI command to `harness`
- issue #19 is the remaining format-layer cleanup for `.clawpack` extension and `.clawpack-*` internal names
- the working tree already contains updates in CLI commands, packer logic, docs, and tests for the `.harness` rename
- some repository tests and helper scripts still contain legacy `clawpack` temp prefixes or old workspace paths and need a final consistency pass

## Open Questions

- whether historical references in `docs/prds/0001-prd-v0.1.md` should remain untouched as archived pre-rename context

## Next Steps

- none; ready for PR

## Artifacts

- issue #19
- `.codex/pm/tasks/product-direction/migrate-format-layer-to-harness.md`
- `src/core/packer.ts`
- `README.md`
- `README_zh.md`
- `test/e2e.test.ts`

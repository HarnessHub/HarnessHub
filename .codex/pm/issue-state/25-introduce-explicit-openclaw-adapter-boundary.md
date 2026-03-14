---
type: issue_state
issue: 25
task: .codex/pm/tasks/product-direction/introduce-explicit-openclaw-adapter-boundary.md
title: Introduce explicit OpenClaw adapter boundary
status: done
delivery_stage: ready_to_deliver
---

## Summary

Introduce an explicit OpenClaw adapter object so runtime-specific inspection and rebinding behavior has a clear boundary inside the HarnessHub architecture.

## Validated Facts

- the MVP already behaves as an OpenClaw-first adapter even though the boundary was implicit
- `packer.ts`, `verifier.ts`, and command handlers were directly coupled to OpenClaw-specific scanner helpers
- a small adapter interface is sufficient to clarify the boundary without changing CLI behavior

## Open Questions

- none

## Next Steps

- none; ready for PR

## Artifacts

- issue #25
- `src/core/adapters/types.ts`
- `src/core/adapters/openclaw.ts`
- `src/core/packer.ts`
- `src/core/verifier.ts`

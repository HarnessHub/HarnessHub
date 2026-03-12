---
type: issue_state
issue: 26
task: .codex/pm/tasks/product-direction/make-import-and-verify-consume-explicit-binding-semantics.md
title: Make import and verify consume explicit binding semantics
status: done
---

## Summary

Make workspace rebinding an explicit manifest contract and have both import and verify consume that contract directly.

## Validated Facts

- import already rebinds workspace config during restore
- the rebinding contract needed to move out of implicit helper behavior into manifest semantics
- verify needed a binding-aware check so rebinding correctness is validated coherently

## Open Questions

- none

## Next Steps

- none; ready for PR

## Artifacts

- issue #26
- `src/core/types.ts`
- `src/core/packer.ts`
- `src/core/adapters/openclaw.ts`
- `src/core/verifier.ts`
- `test/e2e.test.ts`

---
type: issue_state
issue: 47
task: .codex/pm/tasks/product-direction/define-explicit-template-vs-instance-image-contract.md
title: Define explicit template vs instance image contract
status: done
---

## Summary

Turn the current template vs instance distinction into an explicit image contract instead of leaving it as a mostly exclusion-list-driven behavior.

The real OpenClaw end-to-end artifact proved the packaging loop works, but it also showed that `template` still carries a mix of stateful components that are not yet governed by a strong semantic contract. Before broadening scope, HarnessHub should define exactly what a template image may and may not contain.

## Validated Facts

- `template` and `instance` are defined as explicit image contracts, not only operational modes
- pack-type semantics are clear enough to explain why a real source may be recommended as `instance`
- export and verify behavior can enforce the distinction consistently

## Open Questions

-

## Next Steps

- monitor whether template policy needs finer component classification once placement rules harden
- treat the explicit pack-type contract as the baseline for the next verification-layer work

## Artifacts

-

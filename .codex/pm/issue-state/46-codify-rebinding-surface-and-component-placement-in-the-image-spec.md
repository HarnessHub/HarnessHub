---
type: issue_state
issue: 46
task: .codex/pm/tasks/product-direction/codify-rebinding-surface-and-component-placement-in-the-image-spec.md
title: Codify rebinding surface and component placement in the image spec
status: done
---

## Summary

Promote rebinding rules and component placement from implementation detail to explicit harness image specification.

The current real artifact shows that workspace rebinding and top-level component placement already exist in practice, but the rules are still mostly inferred from code. Before future adapter expansion, HarnessHub should make these semantics first-class parts of the image spec.

## Validated Facts

- rebinding behavior is described as part of the image contract rather than only adapter logic
- component placement rules are explicit enough to support future adapter work without archive-layout drift
- manifest and verification semantics reflect the codified rules

## Open Questions

-

## Next Steps

- keep future adapter work aligned with the reserved roots and persisted manifest contract
- extend the rebinding contract only when new mutable config surfaces become explicit product scope

## Artifacts

-

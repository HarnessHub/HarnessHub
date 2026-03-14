---
type: issue_state
issue: 52
task: .codex/pm/tasks/product-direction/publish-a-formal-mvp-harness-image-specification.md
title: Publish a formal MVP Harness image specification
status: done
delivery_stage: ready_to_deliver
---

## Summary

Publish a formal MVP Harness image specification that captures the image contract now implemented in code.

The MVP image model has become materially more explicit: manifest contract, pack-type semantics, placement rules, rebinding surface, and verification semantics now exist in code. A specification document should make that contract legible and stable.

## Validated Facts

- the MVP image contract is documented in one coherent specification document
- the document is consistent with current implementation behavior
- future work can reference the spec instead of rediscovering semantics from code

## Open Questions

-

## Next Steps

- document the MVP image structure, manifest fields, reserved roots, pack types, rebinding, and verification semantics
- align the spec with the current implementation rather than introducing a separate abstract model
- keep the document product-facing and architecture-consistent

## Artifacts

-

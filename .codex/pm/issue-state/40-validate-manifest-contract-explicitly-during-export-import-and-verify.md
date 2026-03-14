---
type: issue_state
issue: 40
task: .codex/pm/tasks/product-direction/validate-manifest-contract-explicitly-during-export-import-and-verify.md
title: Validate manifest contract explicitly during export, import, and verify
status: done
delivery_stage: ready_to_deliver
---

## Summary

Make the harness image manifest contract explicitly validated during export, import, and verify so malformed images fail early with clear errors.

The manifest structure is now more explicit, but the current implementation still relies heavily on structural assumptions at call sites. Before broadening adapter support, the contract should be enforced directly so packaging behavior is predictable and errors are easier to diagnose.

## Validated Facts

- malformed or incomplete manifest data fails with explicit contract errors
- export, import, and verify each enforce the manifest contract at their boundary
- the implementation remains compatible with current MVP scope and improves confidence in future adapter expansion

## Open Questions

-

## Next Steps

- reuse the shared manifest validator for any later adapter-specific manifest extensions
- expand the contract only when new image semantics become explicit product scope

## Artifacts

-

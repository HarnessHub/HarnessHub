---
type: issue_state
issue: 53
task: .codex/pm/tasks/product-direction/refine-verification-into-explicit-readiness-classes.md
title: Refine verification into explicit readiness classes
status: in_progress
---

## Summary

Refine verification semantics beyond a boolean runtime-ready signal into explicit readiness classes that describe what kind of follow-up, if any, is still required.

HarnessHub now distinguishes structural restore from runtime readiness, but the current runtime-ready model is still binary. A richer readiness model would make verify output more actionable without expanding runtime scope.

## Validated Facts

- verify output can express more than a simple ready/not-ready distinction
- current runtime-readiness issues are mapped into explicit readiness classes
- the model improves operator clarity while staying within the MVP image scope

## Open Questions

-

## Next Steps

- define explicit readiness classes for imported images
- map current runtime-readiness issues into those classes
- update verification output and tests to reflect the clearer readiness model

## Artifacts

-

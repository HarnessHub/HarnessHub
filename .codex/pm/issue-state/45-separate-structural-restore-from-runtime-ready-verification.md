---
type: issue_state
issue: 45
task: .codex/pm/tasks/product-direction/separate-structural-restore-from-runtime-ready-verification.md
title: Separate structural restore from runtime-ready verification
status: done
---

## Summary

Split verification semantics so HarnessHub can distinguish between a structurally restored import and a runtime-ready environment.

The real OpenClaw artifact now passes verify while still surfacing warnings that imply the imported result may not be fully runtime-ready. That makes the current `valid` signal too coarse. HarnessHub should make its verification contract more explicit.

## Validated Facts

- verify output can distinguish structural success from runtime readiness
- current warnings that imply incomplete runtime readiness are reflected in the verification model
- the new model improves product clarity without requiring a second runtime adapter yet

## Open Questions

-

## Next Steps

- reuse runtime-readiness semantics in future validation records and CLI explanations
- keep refining which warnings should affect runtime readiness as the image contract tightens

## Artifacts

-

---
type: issue_state
issue: 61
task: .codex/pm/tasks/product-direction/add-remediation-guidance-to-verify-readiness-output.md
title: Add remediation guidance to verify readiness output
status: in_progress
---

## Summary

Make verify output actionable by attaching remediation guidance to non-runtime-ready results.

HarnessHub now reports explicit readiness classes, but operators still need to infer what to do next from raw readiness issues.

## Validated Facts

- verify output tells operators what follow-up is needed for current non-ready cases
- the guidance is stable enough to test in repo
- runtime-ready results remain concise and unchanged in meaning

## Open Questions

-

## Next Steps

- define stable remediation guidance for current verify failure and follow-up cases
- surface the guidance in text and JSON verify output
- keep the guidance within current MVP scope without introducing a policy engine

## Artifacts

-

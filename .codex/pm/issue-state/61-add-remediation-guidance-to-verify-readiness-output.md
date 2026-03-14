---
type: issue_state
issue: 61
task: .codex/pm/tasks/product-direction/add-remediation-guidance-to-verify-readiness-output.md
title: Add remediation guidance to verify readiness output
status: done
delivery_stage: ready_to_deliver
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

- keep future readiness classes aligned with stable remediation wording in text and JSON output

## Artifacts

- merged in PR #64

---
type: task
epic: product-direction
slug: add-remediation-guidance-to-verify-readiness-output
title: Add remediation guidance to verify readiness output
status: done
task_type: implementation
labels: feature,ux
issue: 61
state_path: .codex/pm/issue-state/61-add-remediation-guidance-to-verify-readiness-output.md
---

## Context

Make verify output actionable by attaching remediation guidance to non-runtime-ready results.

HarnessHub now reports explicit readiness classes, but operators still need to infer what to do next from raw readiness issues.

## Deliverable

Make verify output actionable by attaching remediation guidance to non-runtime-ready results.

## Scope

- define stable remediation guidance for current verify failure and follow-up cases
- surface the guidance in text and JSON verify output
- keep the guidance within current MVP scope without introducing a policy engine

## Acceptance Criteria

- verify output tells operators what follow-up is needed for current non-ready cases
- the guidance is stable enough to test in repo
- runtime-ready results remain concise and unchanged in meaning

## Validation

-

## Implementation Notes

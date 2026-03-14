---
type: issue_state
issue: 38
task: .codex/pm/tasks/repository-harness/block-continued-work-on-branches-whose-pr-has-already-merged.md
title: Block continued work on branches whose PR has already merged
status: done
delivery_stage: ready_to_deliver
---

## Summary

Add a local harness guardrail that blocks continued work on a branch once its associated pull request has already merged.

A merged issue branch should be treated as closed delivery state, but it is still easy to keep making changes locally and only realize the mistake later. That creates cleanup work, risks mixed-scope commits, and weakens the one-issue-per-branch rule.

## Validated Facts

- local harness flow blocks continued delivery work on branches whose PR has already merged
- the failure message makes the next correct action obvious
- the guardrail remains local and does not change public product behavior

## Open Questions

-

## Next Steps

- confirm the same merged-branch rule remains enforced in both preflight and pre-push
- treat any later branch-reuse regression as a new harness gap

## Artifacts

-

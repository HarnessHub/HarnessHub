---
type: issue_state
issue: 6
task: .codex/pm/tasks/repository-harness/expand-cli-integration-validation.md
title: Expand CLI integration validation for the pack lifecycle
status: done
---

## Summary

Expand ClawPack's command-level validation so the public CLI path is tested through real process execution, not only direct module invocation.

## Validated Facts

- The repository already has a smoke script for one happy-path template flow.
- The current main gap is command-level coverage for additional success and failure cases at the `dist/cli.js` layer.
- The local task twins for issues `#6` and `#7` needed correction because they were originally swapped.

## Open Questions

- Which error-path assertions are worth locking in without making the tests brittle to superficial message formatting changes?

## Next Steps

- use the new command-level matrix to keep later CLI behavior changes reviewable
- continue `#8` on its own branch to align README claims with the validated behavior

## Artifacts

- `test/cli-integration.test.ts`

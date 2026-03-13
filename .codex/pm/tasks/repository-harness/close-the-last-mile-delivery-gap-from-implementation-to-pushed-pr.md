---
type: task
epic: repository-harness
slug: close-the-last-mile-delivery-gap-from-implementation-to-pushed-pr
title: Close the last-mile delivery gap from implementation to pushed PR
status: done
task_type: implementation
labels: bug,harness,workflow
issue: 71
state_path: .codex/pm/issue-state/71-close-the-last-mile-delivery-gap-from-implementation-to-pushed-pr.md
---

## Context

Close the harness gap where an issue-scoped coding session can stop after implementation, tests, or even commit, instead of carrying the branch through push and pull request creation by default.

In this repository, the intended issue execution flow is end-to-end: branch, task sync, implementation, review checkpoint, preflight, push, and one PR that closes the issue. Today the harness strongly guards several intermediate states, but it still allows a session to stop early after the code is done.

That means a new Codex session may appear to "forget" the last-mile delivery workflow even when the repo-local guidance exists, because the harness does not yet encode the default completion condition strongly enough.

## Deliverable

Close the harness gap where an issue-scoped coding session can stop after implementation, tests, or even commit, instead of carrying the branch through push and pull request creation by default.

## Scope

- define the intended default completion condition for issue-scoped delivery in explicit repo-local terms
- add the smallest reliable guardrail or command path that carries completed issue work through push and PR creation unless the user explicitly asks to stop earlier
- make the current delivery stage legible across sessions so a fresh session can resume without relying on memory
- add regression coverage for the stop-after-commit / no-PR drift case
- update contributor and agent guidance to reflect the hardened flow

## Acceptance Criteria

- issue-scoped delivery has one explicit repo-local completion condition beyond "code committed"
- the local harness provides a default path that continues from completed implementation to pushed branch and opened PR
- a fresh session can tell whether an issue branch is still mid-delivery or already at PR-open state
- regression coverage protects against the workflow stopping after commit when the issue is otherwise ready to land
- repo-local workflow docs and skills describe the new default clearly

## Validation

-

## Implementation Notes

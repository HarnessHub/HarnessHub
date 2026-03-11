---
type: task
epic: repository-harness
slug: expand-cli-integration-validation
title: Expand CLI integration validation for the pack lifecycle
status: backlog
task_type: implementation
labels: feature,test
issue: 7
---

## Context

ClawPack now has a basic CLI smoke path, but the command-level validation matrix remains thinner than the public CLI surface.

## Deliverable

Expand command-level validation for `inspect`, `export`, `import`, and `verify`, with emphasis on real CLI behavior rather than direct module invocation.

## Scope

- add command-level integration coverage for template and instance flows
- add user-visible error-path coverage where behavior matters
- complement the existing smoke path instead of duplicating it

## Acceptance Criteria

- key user-facing CLI paths are exercised at the command layer
- failures are asserted through exit status and output behavior
- the command-level matrix is clearly distinct from module-level tests

## Validation

- `npm test`
- targeted CLI integration runs as added by the task

## Implementation Notes

Focus on the public contract of the shipped `clawpack` CLI.

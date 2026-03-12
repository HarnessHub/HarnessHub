---
type: task
epic: product-direction
slug: rename-clawpack-to-harness
title: Rename codebase branding and CLI from clawpack to harness
status: in_progress
task_type: implementation
labels: feature,docs,test
issue: 17
state_path: .codex/pm/issue-state/17-rename-clawpack-to-harness.md
---

## Context

The repository has already moved to the HarnessHub identity at the repository layer, but the shipped package, CLI command, and user-facing codebase strings still use the old ClawPack naming.


## Deliverable

Rename the shipped package and CLI surface to the HarnessHub naming model, with `harness` as the primary command.


## Scope

- rename the npm package metadata to the HarnessHub naming
- rename the CLI command from `clawpack` to `harness`
- update user-facing product strings from ClawPack to HarnessHub where they refer to the active product
- update scripts and tests that assume the old command name
- introduce renamed script environment variables while keeping backward-compatible fallback behavior where practical

## Acceptance Criteria

- the package metadata no longer publishes as `clawpack`
- the CLI program name is `harness`
- docs and tests consistently use `harness`
- validation still passes after the rename

## Validation

- `npm test`
- `./scripts/run-agent-preflight.sh`

## Implementation Notes

Keep the `.clawpack` archive format unchanged in this issue; this is a branding and CLI rename, not a package-format migration.

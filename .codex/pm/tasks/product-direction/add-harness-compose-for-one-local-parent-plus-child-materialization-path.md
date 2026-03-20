---
type: task
epic: product-direction
slug: add-harness-compose-for-one-local-parent-plus-child-materialization-path
title: Add harness compose for one local parent-plus-child materialization path
status: done
task_type: implementation
issue: 105
state_path: .codex/pm/issue-state/105-add-harness-compose-for-one-local-parent-plus-child-materialization-path.md
---

## Context

Add the first narrow composition flow for the v0.2.0 line.

## Deliverable

Add the first narrow composition flow for the v0.2.0 line.

## Scope

- add `harness compose` as the public local composition command
- support exactly one parent + one child compose path
- materialize a composed local result for later export/import/verify
- make merge semantics explicit and fail fast on unsupported conflicts

## Acceptance Criteria

- `harness compose` can materialize a supported two-layer result
- supported composable components are clearly documented
- unsupported overlap fails with explicit operator-facing errors
- tests cover the happy path and key conflict cases

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-cli-smoke.sh`

## Implementation Notes

- added `src/core/compose.ts` to materialize one parent-plus-child local compose result with explicit passthrough conflict detection
- added `src/commands/compose.ts` and wired the command into `src/cli.ts`
- documented the supported override/passthrough model in `docs/specs/0003-v0-2-0-local-compose-materialization.md`
- added core, command-entrypoint, and real CLI integration coverage for happy-path and conflict-path compose behavior

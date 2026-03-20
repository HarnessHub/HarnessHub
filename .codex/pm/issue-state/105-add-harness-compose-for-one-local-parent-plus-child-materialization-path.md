---
type: issue_state
issue: 105
task: .codex/pm/tasks/product-direction/add-harness-compose-for-one-local-parent-plus-child-materialization-path.md
title: Add harness compose for one local parent-plus-child materialization path
status: done
delivery_stage: pr_opened
pr_url: https://github.com/HarnessHub/HarnessHub/pull/115
---

## Summary

Add the first narrow composition flow for the v0.2.0 line.

## Validated Facts

- `harness compose` can materialize a supported two-layer result
- supported composable components are clearly documented
- unsupported overlap fails with explicit operator-facing errors
- tests cover the happy path and key conflict cases
- the composed output rebinds workspace targets to the materialized output directory
- the parent may contribute passthrough roots as long as the child does not overlap them

## Open Questions

-

## Next Steps

- commit, review-checkpoint, preflight, and deliver the branch
- after merge, continue with `#109`

## Artifacts

- `src/core/compose.ts`
- `src/commands/compose.ts`
- `docs/specs/0003-v0-2-0-local-compose-materialization.md`
- `test/e2e.test.ts`
- `test/cli-integration.test.ts`
- `test/command-entrypoints.test.ts`

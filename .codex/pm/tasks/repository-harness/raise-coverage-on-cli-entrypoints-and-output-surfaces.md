---
type: task
epic: repository-harness
slug: raise-coverage-on-cli-entrypoints-and-output-surfaces
title: Raise coverage on CLI entrypoints and command/output surfaces
status: done
task_type: implementation
labels: test
issue: 83
state_path: .codex/pm/issue-state/83-raise-coverage-on-cli-entrypoints-and-output-surfaces.md
---

## Context

The repository now reports coverage in GitHub, and the current baseline is:

- Lines: 69.4%
- Statements: 69.4%
- Functions: 88.9%
- Branches: 66.1%

The biggest gap is not in core image logic, which is already well-covered, but in the user-facing command and output layer.

## Deliverable

The repository now reports coverage in GitHub, and the current baseline is:

- Lines: 69.4%
- Statements: 69.4%
- Functions: 88.9%
- Branches: 66.1%

The biggest gap is not in core image logic, which is already well-covered, but in the user-facing command and output layer.

## Scope

- add direct tests for `src/utils/output.ts` text/json rendering paths
- add direct tests for `src/commands/*` handlers and `src/cli.ts` entrypoint wiring
- keep existing CLI smoke and end-to-end flows intact while raising targeted source coverage

## Acceptance Criteria

- `src/commands/*` are no longer reported at effectively 0% coverage
- `src/cli.ts` and `src/utils/output.ts` have direct coverage
- coverage improvement is measurable in both line and branch metrics
- the plan does not replace current smoke/e2e tests; it complements them with targeted regression tests
- any thresholding added is scoped and maintainable rather than arbitrary

## Validation

- `npx vitest run test/output-formatting.test.ts test/command-entrypoints.test.ts`
- `npm test`
- `./scripts/run-cli-smoke.sh`
- `npm run test:coverage`
- `npm run coverage:summary`

## Implementation Notes

- coverage after the change: Lines `82.2%`, Statements `82.2%`, Functions `91.89%`, Branches `69.14%`
- direct source coverage now includes `src/cli.ts` (`92.59%` lines), `src/utils/output.ts` (`97.83%` lines / `89.83%` branches), and strong direct coverage across `src/commands/*` (`93.95%` lines / `70.96%` branches)

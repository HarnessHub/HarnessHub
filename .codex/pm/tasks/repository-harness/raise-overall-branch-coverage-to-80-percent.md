---
type: task
epic: repository-harness
slug: raise-overall-branch-coverage-to-80-percent
title: Raise overall branch coverage to 80 percent
status: done
task_type: implementation
issue: 85
state_path: .codex/pm/issue-state/85-raise-overall-branch-coverage-to-80-percent.md
---

## Context

Current overall branch coverage is below the desired release-quality bar. The recent CLI/command coverage work substantially improved user-entrypoint coverage, but it intentionally should not carry the repository-wide branch-coverage objective.

## Deliverable

Current overall branch coverage is below the desired release-quality bar. The recent CLI/command coverage work substantially improved user-entrypoint coverage, but it intentionally should not carry the repository-wide branch-coverage objective.

## Scope

- improve branch coverage in the largest remaining low-coverage areas
- prioritize `scripts/codex-pm.mjs`, `src/core/verifier.ts`, `src/core/scanner.ts`, and `scripts/render-coverage-summary.mjs`
- keep the work separate from issue #83, which is limited to CLI and command-surface coverage

## Acceptance Criteria

- `npm run test:coverage` reports overall branch coverage of at least `80%`
- added tests are targeted and maintainable rather than padding coverage with low-value assertions
- existing CLI, smoke, e2e, and repository-harness validation remain green

## Validation

- `npm test`
- `npm run test:coverage`

## Implementation Notes

- Added focused regression tests for `codex-pm`, manifest validation, OpenClaw rebinding, scanner/verifier edge cases, coverage-summary rendering, and command/output branches.
- Kept direct-execution defensive paths such as `import.meta` guards out of scope while driving overall branch coverage to `80%`.

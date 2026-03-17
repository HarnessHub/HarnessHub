---
type: issue_state
issue: 83
task: .codex/pm/tasks/repository-harness/raise-coverage-on-cli-entrypoints-and-output-surfaces.md
title: Raise coverage on CLI entrypoints and command/output surfaces
status: in_progress
delivery_stage: in_progress
---

## Summary

The repository now reports coverage in GitHub, and the current baseline is:

- Lines: 69.4%
- Statements: 69.4%
- Functions: 88.9%
- Branches: 66.1%

The biggest gap is not in core image logic, which is already well-covered, but in the user-facing command and output layer.

## Validated Facts

- overall coverage now measures `80.3%` lines/statements, `91.2%` functions, and `65.6%` branches
- `src/cli.ts` now has direct coverage at `92.59%` lines and `66.66%` branches
- `src/utils/output.ts` now has direct coverage at `92.97%` lines and `61.53%` branches
- `src/commands/*` are no longer effectively uncovered: `inspect.ts` `85.1%`, `verify.ts` `76.92%`, `import.ts` `69.81%`, `export.ts` `56.57%` line coverage
- targeted command/output tests complement rather than replace the existing smoke and e2e paths

## Open Questions

- whether a follow-up issue should keep pushing `export.ts` branch coverage before introducing per-scope thresholds

## Next Steps

- deliver issue #83 through review checkpoint, preflight, and PR creation

## Artifacts

- `test/command-entrypoints.test.ts`
- `test/output-formatting.test.ts`
- `src/cli.ts`

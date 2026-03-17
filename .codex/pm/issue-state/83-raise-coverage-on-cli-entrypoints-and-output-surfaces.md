---
type: issue_state
issue: 83
task: .codex/pm/tasks/repository-harness/raise-coverage-on-cli-entrypoints-and-output-surfaces.md
title: Raise coverage on CLI entrypoints and command/output surfaces
status: done
delivery_stage: pr_opened
pr_url: https://github.com/HarnessHub/HarnessHub/pull/84
---

## Summary

The repository now reports coverage in GitHub, and the current baseline is:

- Lines: 69.4%
- Statements: 69.4%
- Functions: 88.9%
- Branches: 66.1%

The biggest gap is not in core image logic, which is already well-covered, but in the user-facing command and output layer.

## Validated Facts

- overall coverage now measures `82.2%` lines/statements, `91.89%` functions, and `69.14%` branches
- `src/cli.ts` now has direct coverage at `92.59%` lines and `66.66%` branches
- `src/utils/output.ts` now has direct coverage at `97.83%` lines and `89.83%` branches
- `src/commands/*` now has strong direct coverage: `inspect.ts` `95.74%`, `verify.ts` `94.87%`, `import.ts` `96.22%`, `export.ts` `90.78%` line coverage
- targeted command/output tests complement rather than replace the existing smoke and e2e paths

## Open Questions

- whether a follow-up issue should keep pushing `export.ts` branch coverage before introducing per-scope thresholds

## Next Steps

- deliver issue #83 through review checkpoint, preflight, and PR creation

## Artifacts

- `test/command-entrypoints.test.ts`
- `test/output-formatting.test.ts`
- `src/cli.ts`

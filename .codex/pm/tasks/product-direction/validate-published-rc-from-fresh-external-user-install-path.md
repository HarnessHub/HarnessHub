---
type: task
epic: product-direction
slug: validate-published-rc-from-fresh-external-user-install-path
title: Validate published 0.1.0-rc.1 from a fresh external-user install path
status: in_progress
task_type: implementation
labels: release,validation
issue: 98
state_path: .codex/pm/issue-state/98-validate-published-rc-from-fresh-external-user-install-path.md
---

## Context

Run a post-release validation pass against the published `harnesshub@0.1.0-rc.1` package from a clean environment that is not relying on the current development checkout.

This is the execution issue for the external-user install path referenced by parent issue #97.

## Deliverable

Run a post-release validation pass against the published `harnesshub@0.1.0-rc.1` package from a clean environment that is not relying on the current development checkout.

This is the execution issue for the external-user install path referenced by parent issue #97.

## Scope

- validate `npx harnesshub@0.1.0-rc.1 --version` from a fresh directory
- follow the shortest README happy path from the perspective of a new operator
- verify the installed CLI behavior matches the repository documentation
- capture validation artifacts and any operator-facing gaps discovered during the run

## Acceptance Criteria

- published-package validation record uses `harnesshub@0.1.0-rc.1` rather than a local tarball path
- the validation record captures a fresh-directory `npx` version check and a packaged install/roundtrip flow
- release-candidate docs describe the external-user install path in terms of the published RC, not a local source checkout
- automated coverage protects the fresh-operator validation script against package-spec resolution regressions

## Validation

- `npm test`
- `HARNESSHUB_FRESH_OPERATOR_PACKAGE_SPEC=harnesshub@0.1.0-rc.1 npm run fresh-operator`

## Implementation Notes

- `run-fresh-operator-validation.sh` now records a fresh-directory `npx` version check before the isolated install flow.
- The script has to branch between published package specs and local `.tgz` specs because `npx <tarball-path>` tries to execute the tarball directly.
- The `npx` check must run from a temp directory outside the repository tree so package-name/bin-name resolution matches an external-user environment.

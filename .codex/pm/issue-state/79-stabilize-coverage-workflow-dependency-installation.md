---
type: issue_state
issue: 79
task: .codex/pm/tasks/repository-harness/stabilize-coverage-workflow-dependency-installation.md
title: Stabilize coverage workflow dependency installation
status: done
delivery_stage: pr_opened
pr_url: https://github.com/HarnessHub/HarnessHub/pull/80
---

## Summary

The new GitHub coverage workflow can fail during dependency installation on GitHub Actions even when the repository installs cleanly locally with `npm ci`. When that happens, the coverage step cannot find `vitest` and the workflow stops before publishing any coverage output.

## Validated Facts

- GitHub Actions run `23092416227` failed in the coverage job because `npm ci` errored before `vitest` was available
- the failure mode is specific to the GitHub runner path; local `npm ci` succeeds in the repository
- the coverage workflow now installs dependencies through `scripts/install-ci-deps.sh`
- the install script retries `npm ci` twice, falls back to `npm install`, and fails fast if `node_modules/.bin/vitest` is still unavailable
- the workflow still runs coverage, publishes the summary, and uploads the artifact
- the fallback logic is covered by a repository-local regression test
- full local validation passes with `npm test`

## Open Questions

-

## Next Steps

- refresh review proof and deliver the issue branch through the normal PR flow

## Artifacts

- `.github/workflows/coverage.yml`
- `scripts/install-ci-deps.sh`
- `test/install-ci-deps-script.test.ts`

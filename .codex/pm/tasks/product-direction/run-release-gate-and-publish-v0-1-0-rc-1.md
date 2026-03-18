---
type: task
epic: product-direction
slug: run-release-gate-and-publish-v0-1-0-rc-1
title: Run release gate and publish HarnessHub v0.1.0-rc.1
status: done
task_type: implementation
issue: 95
state_path: .codex/pm/issue-state/95-run-release-gate-and-publish-v0-1-0-rc-1.md
---

## Context

Publish the first HarnessHub MVP release candidate as `v0.1.0-rc.1` by closing the remaining release-execution gap between the current unreleased repository state and an externally visible release artifact.

## Deliverable

Publish the first HarnessHub MVP release candidate as `v0.1.0-rc.1` by closing the remaining release-execution gap between the current unreleased repository state and an externally visible release artifact.

## Scope

- run the full release gate on a clean candidate branch:
  - `npm run build`
  - `npm test`
  - `./scripts/run-agent-preflight.sh`
  - `./scripts/run-cli-smoke.sh`
  - `./scripts/run-openclaw-e2e-validation.sh`
- perform a fresh-operator validation pass that follows the documented acceptance path as closely as practical
- add a minimal release runbook so the execution order is explicit and repeatable
- finalize release-facing metadata for the published RC, including changelog date and release notes
- create the external release artifact(s) needed for `v0.1.0-rc.1`

## Acceptance Criteria

- the full release gate passes on the candidate branch with no unexpected dirty worktree drift left behind
- the repository contains a minimal release runbook for this RC closeout flow
- the documented RC acceptance path has been validated in a fresh-operator style environment and the result is recorded
- `CHANGELOG.md` no longer lists `v0.1.0-rc.1` as `Unreleased` once the RC is cut
- `v0.1.0-rc.1` exists as an external release artifact with final release notes

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-agent-preflight.sh`
- `./scripts/run-cli-smoke.sh`
- `./scripts/run-openclaw-e2e-validation.sh`
- `npm run fresh-operator`
- `npm publish --dry-run --tag rc`

## Implementation Notes

- added a minimal RC release runbook and release-notes document for `v0.1.0-rc.1`
- pinned README install guidance to the explicit RC package version so npm dist-tag strategy can remain prerelease-safe
- added a fresh-operator validation script and committed validation record based on an isolated package install
- fixed a packaged CLI blocker where the installed `harness` bin failed to run through the npm-generated symlink path

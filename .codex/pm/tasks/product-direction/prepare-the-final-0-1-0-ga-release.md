---
type: task
epic: product-direction
slug: prepare-the-final-0-1-0-ga-release
title: Prepare the final HarnessHub 0.1.0 GA release
status: in_progress
task_type: implementation
labels: release,ga
issue: 102
state_path: .codex/pm/issue-state/102-prepare-the-final-0-1-0-ga-release.md
---

## Context

Prepare the final `0.1.0` general-availability release now that the repository's current post-RC judgment favors direct promotion from `v0.1.0-rc.1` rather than cutting `v0.1.0-rc.2` by default.

This issue is the execution issue for the final GA closeout and publication flow. It should use the written gate in `docs/releases/0005-v0-1-0-ga-go-no-go-gate.md` rather than re-deciding GA readiness ad hoc.

## Deliverable

Prepare the final `0.1.0` general-availability release now that the repository's current post-RC judgment favors direct promotion from `v0.1.0-rc.1` rather than cutting `v0.1.0-rc.2` by default.

This issue is the execution issue for the final GA closeout and publication flow. It should use the written gate in `docs/releases/0005-v0-1-0-ga-go-no-go-gate.md` rather than re-deciding GA readiness ad hoc.

## Scope

- re-run the GA candidate release gate on the final `0.1.0` candidate commit
- update versioning and release notes from `0.1.0-rc.1` to `0.1.0`
- publish the final `0.1.0` package and GitHub release
- record the final go/no-go outcome back into issue #97

## Acceptance Criteria

- the repository and CLI version surfaces are updated from `0.1.0-rc.1` to `0.1.0` without rewriting the RC historical record
- GA-facing docs, install guidance, changelog, and release notes consistently describe the published `0.1.0` release
- the GA candidate commit passes the documented release gate and leaves no unintended dirty-worktree drift
- the final `0.1.0` release is published to GitHub Releases and npm, then linked back into issue `#97`

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-agent-preflight.sh`
- `./scripts/run-cli-smoke.sh`
- `./scripts/run-openclaw-e2e-validation.sh`
- `npm run fresh-operator`
- `gh release view v0.1.0 --json tagName,isPrerelease,publishedAt,url`
- `npm view harnesshub dist-tags --json`

## Implementation Notes

- keep `docs/releases/0003-v0-1-0-rc-1-runbook.md` and `docs/releases/0004-v0-1-0-rc-1-notes.md` as historical RC records
- add GA-specific release notes/runbook rather than overwriting RC history
- close issue `#97` only after `#102` has published `0.1.0` and recorded the final go/no-go outcome

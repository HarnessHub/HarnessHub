---
type: issue_state
issue: 95
task: .codex/pm/tasks/product-direction/run-release-gate-and-publish-v0-1-0-rc-1.md
title: Run release gate and publish HarnessHub v0.1.0-rc.1
status: done
delivery_stage: pr_opened
pr_url: https://github.com/HarnessHub/HarnessHub/pull/96
---

## Summary

Publish the first HarnessHub MVP release candidate as `v0.1.0-rc.1` by closing the remaining release-execution gap between the current unreleased repository state and an externally visible release artifact.

## Validated Facts

- `npm test`, CLI smoke, OpenClaw e2e validation, and fresh-operator validation all pass against the RC closeout branch
- the repository now contains a minimal release runbook and release-notes document for `v0.1.0-rc.1`
- the packaged CLI path works through the npm-installed `harness` symlink after fixing direct-execution detection
- `npm publish --dry-run --tag rc` succeeds, so the remaining external publish risk is registry-side execution rather than package shape

## Open Questions

-

## Next Steps

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

## Artifacts

- `docs/releases/0003-v0-1-0-rc-1-runbook.md`
- `docs/releases/0004-v0-1-0-rc-1-notes.md`
- `docs/validation/openclaw-e2e-validation.md`
- `docs/validation/fresh-operator-validation.md`

---
type: task
epic: product-direction
slug: unify-repository-versioning-on-0-1-0-rc-1
title: Unify repository versioning on 0.1.0-rc.1
status: done
task_type: implementation
issue: 89
state_path: .codex/pm/issue-state/89-unify-repository-versioning-on-0-1-0-rc-1.md
---

## Context

The repository now documents the MVP release line as `0.1.0`, with the current release candidate target set to `0.1.0-rc.1`. However, code-level and release-facing version surfaces still present a mixed story: `package.json` and the CLI report `0.1.0`, while roadmap and release framing docs talk about `0.1.0-rc.1` as the active release-candidate target.

We should unify all relevant repository version surfaces on `0.1.0-rc.1` so the published package metadata, CLI version output, changelog, and release framing all describe the same release state.

## Deliverable

The repository now documents the MVP release line as `0.1.0`, with the current release candidate target set to `0.1.0-rc.1`. However, code-level and release-facing version surfaces still present a mixed story: `package.json` and the CLI report `0.1.0`, while roadmap and release framing docs talk about `0.1.0-rc.1` as the active release-candidate target.

We should unify all relevant repository version surfaces on `0.1.0-rc.1` so the published package metadata, CLI version output, changelog, and release framing all describe the same release state.

## Scope

- update package and CLI version surfaces to `0.1.0-rc.1`
- align release-facing docs and changelog with the RC version
- ensure there is no remaining ambiguity between current shipped version and current release-candidate target

## Acceptance Criteria

- `package.json` reports `0.1.0-rc.1`
- `harness --version` reports `0.1.0-rc.1`
- release-facing docs and changelog consistently describe the current release state as `0.1.0-rc.1`
- no remaining repo references imply that the shipped code is already final `0.1.0` while the docs still describe an RC target

## Validation

- `rg -n "0\.1\.0-rc\.1|0\.1\.0" README.md README_zh.md docs src package.json CHANGELOG.md .codex/pm package-lock.json`
- `npm run build`
- `npm test`
- `node dist/cli.js --version`

## Implementation Notes

- updated package metadata and lockfile version fields to `0.1.0-rc.1`
- aligned the CLI version string with package metadata
- clarified release-facing docs so `0.1.0-rc.1` is the current shipped state and `0.1.0` remains the intended GA target

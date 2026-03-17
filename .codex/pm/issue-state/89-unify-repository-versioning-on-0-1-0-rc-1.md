---
type: issue_state
issue: 89
task: .codex/pm/tasks/product-direction/unify-repository-versioning-on-0-1-0-rc-1.md
title: Unify repository versioning on 0.1.0-rc.1
status: done
delivery_stage: ready_to_deliver
---

## Summary

The repository now documents the MVP release line as `0.1.0`, with the current release candidate target set to `0.1.0-rc.1`. However, code-level and release-facing version surfaces still present a mixed story: `package.json` and the CLI report `0.1.0`, while roadmap and release framing docs talk about `0.1.0-rc.1` as the active release-candidate target.

We should unify all relevant repository version surfaces on `0.1.0-rc.1` so the published package metadata, CLI version output, changelog, and release framing all describe the same release state.

## Validated Facts

- `package.json` reports `0.1.0-rc.1`
- `harness --version` reports `0.1.0-rc.1`
- release-facing docs and changelog consistently describe the current release state as `0.1.0-rc.1`
- no remaining repo references imply that the shipped code is already final `0.1.0` while the docs still describe an RC target

## Open Questions

-

## Next Steps

- update package and CLI version surfaces to `0.1.0-rc.1`
- align release-facing docs and changelog with the RC version
- ensure there is no remaining ambiguity between current shipped version and current release-candidate target

## Artifacts

- `npm run build`
- `npm test`
- `node dist/cli.js --version` -> `0.1.0-rc.1`

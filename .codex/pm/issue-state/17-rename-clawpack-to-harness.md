---
type: issue_state
issue: 17
task: .codex/pm/tasks/product-direction/rename-clawpack-to-harness.md
title: Rename codebase branding and CLI from clawpack to harness
status: in_progress
---

## Summary

Track the code-level rename from the old ClawPack branding and `clawpack` CLI toward the HarnessHub brand and `harness` command surface.

## Validated Facts

- the repository identity already moved to HarnessHub at the remote and metadata level
- the shipped package metadata and CLI command still use `clawpack`
- many docs and tests still assume `clawpack`, but the `.clawpack` archive extension can remain unchanged for now

## Open Questions

- whether a future follow-up should also rename the archive extension and manifest sidecar names

## Next Steps

- none; ready for review

## Artifacts

- issue #17
- `package.json`
- `src/cli.ts`
- `scripts/run-agent-preflight.sh`
- `README.md`

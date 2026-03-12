---
type: issue_state
issue: 15
task: .codex/pm/tasks/product-direction/update-harnesshub-metadata.md
title: Update repository metadata and remotes after HarnessHub migration
status: done
---

## Summary

Track the repository rename follow-up so local remotes, repository metadata, and GitHub repo descriptions all point to the new HarnessHub locations.

## Validated Facts

- the upstream repository now lives at `HarnessHub/HarnessHub`
- the fork now lives at `yaoyinnan/HarnessHub`
- tracked files still contain old `Mrxuexi/clawpack` URLs and descriptions

## Open Questions

- whether a future issue should rename the shipped CLI and package from `clawpack` as well

## Next Steps

- none; ready for review

## Artifacts

- issue #15
- `package.json`
- `README.md`
- `README_zh.md`
- `AGENTS.md`
- `CONTRIBUTING.md`

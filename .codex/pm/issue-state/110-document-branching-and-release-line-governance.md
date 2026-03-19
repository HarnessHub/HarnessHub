---
type: issue_state
issue: 110
task: .codex/pm/tasks/repository-harness/document-branching-and-release-line-governance.md
title: Document branching and release-line governance for stable versions
status: done
delivery_stage: pr_opened
pr_url: https://github.com/HarnessHub/HarnessHub/pull/111
---

## Summary

Document the repository branch model now that HarnessHub has shipped `0.1.0` and needs a clearer relationship between `main`, feature branches, and version release lines.

## Validated Facts

- `AGENTS.md` currently tells agents to start each issue branch from the latest `upstream/main`
- `docs/engineering/repository-governance.md` currently repeats the same `upstream/main` default
- the local pre-push hook and preflight scripts default to `upstream/main`, but both already support base-ref overrides through `HARNESSHUB_BASE_REF` / `HARNESSHUB_PREFLIGHT_BASE_REF`
- the repository does not yet have a dedicated engineering doc that explains the long-lived relationship between `main` and future `release/x.y` branches

## Open Questions

-

## Next Steps

- define the long-lived role of `main`
- define when to create `release/x.y` branches
- define how issue branches should choose their base branch
- define how fixes are backported between `main` and release branches
- define whether release branches are short-lived or kept for `x.y.z` patch maintenance
- add an explicit reference from `AGENTS.md` so future coding agents follow the branching/release governance by default

## Artifacts

- `docs/engineering/repository-governance.md`
- `docs/engineering/tooling-setup.md`
- `AGENTS.md`
- `.githooks/pre-push`
- `scripts/run-agent-preflight.sh`

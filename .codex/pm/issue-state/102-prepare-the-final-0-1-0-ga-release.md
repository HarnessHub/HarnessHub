---
type: issue_state
issue: 102
task: .codex/pm/tasks/product-direction/prepare-the-final-0-1-0-ga-release.md
title: Prepare the final HarnessHub 0.1.0 GA release
status: in_progress
delivery_stage: implementing
---

## Summary

Prepare the final `0.1.0` general-availability release now that the repository's current post-RC judgment favors direct promotion from `v0.1.0-rc.1` rather than cutting `v0.1.0-rc.2` by default.

This issue is the execution issue for the final GA closeout and publication flow. It should use the written gate in `docs/releases/0005-v0-1-0-ga-go-no-go-gate.md` rather than re-deciding GA readiness ad hoc.

## Validated Facts

- current branch is `issue-102-prepare-the-final-0-1-0-ga-release`
- GitHub auth is available for release creation through `gh`
- npm auth is available for package publication through `npm`
- published RC baseline is `v0.1.0-rc.1` on GitHub and `harnesshub@0.1.0-rc.1` on npm
- issue `#97` remains the umbrella post-RC closeout issue and should be closed only after `#102` records the final GA outcome

## Open Questions

- whether README install guidance should stay version-pinned at `0.1.0` or return to the unpinned stable install form after GA publication

## Next Steps

- re-run the GA candidate release gate on the final `0.1.0` candidate commit
- update versioning and release notes from `0.1.0-rc.1` to `0.1.0`
- publish the final `0.1.0` package and GitHub release
- record the final go/no-go outcome back into issue #97

## Artifacts

- `docs/releases/0005-v0-1-0-ga-go-no-go-gate.md`
- `docs/releases/0004-v0-1-0-rc-1-notes.md`
- `docs/validation/fresh-operator-validation.md`
- `docs/validation/openclaw-e2e-validation.md`

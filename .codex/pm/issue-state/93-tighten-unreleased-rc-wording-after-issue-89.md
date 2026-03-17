---
type: issue_state
issue: 93
task: .codex/pm/tasks/product-direction/tighten-unreleased-rc-wording-after-issue-89.md
title: Tighten unreleased RC wording after issue 89
status: done
delivery_stage: ready_to_deliver
---

## Summary

Issue #89 correctly aligned repository version surfaces to `0.1.0-rc.1`, but some release-facing wording can still be read as if `0.1.0-rc.1` has already been publicly published.

We should tighten that language so repository and CLI version metadata are described as repository-local or unreleased release-candidate state unless there is an explicit published release artifact to point to.

## Validated Facts

- no tracked docs imply that `0.1.0-rc.1` has already been externally published unless a concrete published artifact is cited
- repository-local version strings can still report `0.1.0-rc.1`
- roadmap and release framing clearly distinguish current repository versioning from external release status

## Open Questions

-

## Next Steps

- update release-facing docs to avoid implying `0.1.0-rc.1` is already published
- prefer wording like `unreleased repository version`, `next release candidate version`, or equivalent precise phrasing
- preserve the distinction that `0.1.0` remains the intended GA target

## Artifacts

- `npm run build`
- `npm test`
- `rg -n "published|repository/package version|current repository|currently shipped|Unreleased|0\.1\.0-rc\.1" docs/releases/0002-mvp-release-candidate.md docs/prds/0003-roadmap-mvp-to-v1.md CHANGELOG.md README.md README_zh.md`

---
type: task
epic: product-direction
slug: tighten-unreleased-rc-wording-after-issue-89
title: Tighten unreleased RC wording after issue 89
status: done
task_type: implementation
issue: 93
state_path: .codex/pm/issue-state/93-tighten-unreleased-rc-wording-after-issue-89.md
---

## Context

Issue #89 correctly aligned repository version surfaces to `0.1.0-rc.1`, but some release-facing wording can still be read as if `0.1.0-rc.1` has already been publicly published.

We should tighten that language so repository and CLI version metadata are described as repository-local or unreleased release-candidate state unless there is an explicit published release artifact to point to.

## Deliverable

Issue #89 correctly aligned repository version surfaces to `0.1.0-rc.1`, but some release-facing wording can still be read as if `0.1.0-rc.1` has already been publicly published.

We should tighten that language so repository and CLI version metadata are described as repository-local or unreleased release-candidate state unless there is an explicit published release artifact to point to.

## Scope

- update release-facing docs to avoid implying `0.1.0-rc.1` is already published
- prefer wording like `unreleased repository version`, `next release candidate version`, or equivalent precise phrasing
- preserve the distinction that `0.1.0` remains the intended GA target

## Acceptance Criteria

- no tracked docs imply that `0.1.0-rc.1` has already been externally published unless a concrete published artifact is cited
- repository-local version strings can still report `0.1.0-rc.1`
- roadmap and release framing clearly distinguish current repository versioning from external release status

## Validation

- `rg -n "published|repository/package version|current repository|release candidate|0\.1\.0-rc\.1" docs/releases/0002-mvp-release-candidate.md docs/prds/0003-roadmap-mvp-to-v1.md CHANGELOG.md README.md README_zh.md`
- `npm run build`
- `npm test`

## Implementation Notes

- revised release framing to describe `0.1.0-rc.1` as an unreleased repository/CLI version rather than an already published release
- changed the changelog heading from a dated release entry to `Unreleased` for the RC line

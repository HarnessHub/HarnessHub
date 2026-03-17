---
type: task
epic: product-direction
slug: reframe-mvp-release-line-as-0-1-0-with-an-rc-1-pre-release
title: Reframe MVP release line as 0.1.0 with an rc.1 pre-release
status: done
task_type: implementation
issue: 87
state_path: .codex/pm/issue-state/87-reframe-mvp-release-line-as-0-1-0-with-an-rc-1-pre-release.md
---

## Context

Reset the MVP version framing so the MVP release line is `0.1.0`, with the next publish target being `0.1.0-rc.1` rather than `0.2.0-rc.1`.

The repository currently mixes two different version stories: `package.json` still reports `0.1.0`, while roadmap/release docs describe the current MVP as `v0.2.0-rc.1`. We should align the MVP framing before doing release-closeout work.

## Deliverable

Reset the MVP version framing so the MVP release line is `0.1.0`, with the next publish target being `0.1.0-rc.1` rather than `0.2.0-rc.1`.

## Scope

- update release and roadmap docs so the MVP line is `0.1.0`
- frame the immediate candidate as `0.1.0-rc.1`
- keep this issue limited to version framing and release-document consistency
- do not cut the release yet; follow-up release-closeout work will handle final publication

## Acceptance Criteria

- repository docs consistently describe the MVP release line as `0.1.0`
- the current pre-release target is documented as `0.1.0-rc.1`
- no release/tag/package publication is performed as part of this issue
- follow-up release-closeout work remains clearly separated from this framing change

## Validation

- `rg -n "0\\.2\\.0-rc\\.1|historical seed release" docs/prds/0003-roadmap-mvp-to-v1.md docs/releases/0002-mvp-release-candidate.md`
- `npm test`

## Implementation Notes

- `package.json` already reports `0.1.0`, so this issue only needs to reconcile roadmap/release framing and leave actual publish work to a follow-up closeout issue.

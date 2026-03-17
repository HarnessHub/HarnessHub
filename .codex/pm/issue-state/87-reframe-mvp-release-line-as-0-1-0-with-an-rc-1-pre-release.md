---
type: issue_state
issue: 87
task: .codex/pm/tasks/product-direction/reframe-mvp-release-line-as-0-1-0-with-an-rc-1-pre-release.md
title: Reframe MVP release line as 0.1.0 with an rc.1 pre-release
status: done
delivery_stage: ready_to_deliver
---

## Summary

Reset the MVP version framing so the MVP release line is `0.1.0`, with the next publish target being `0.1.0-rc.1` rather than `0.2.0-rc.1`.

The repository currently mixes two different version stories: `package.json` still reports `0.1.0`, while roadmap/release docs describe the current MVP as `v0.2.0-rc.1`. We should align the MVP framing before doing release-closeout work.

## Validated Facts

- repository docs consistently describe the MVP release line as `0.1.0`
- the current pre-release target is documented as `0.1.0-rc.1`
- no release/tag/package publication is performed as part of this issue
- follow-up release-closeout work remains clearly separated from this framing change
- `package.json` already reports `0.1.0`, so the required changes are limited to roadmap and release framing docs

## Open Questions

- none

## Next Steps

- refresh review proof, run delivery preflight, and open the framing-only PR

## Artifacts

- `docs/prds/0003-roadmap-mvp-to-v1.md`
- `docs/releases/0002-mvp-release-candidate.md`
- `npm test`

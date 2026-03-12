---
type: task
epic: product-direction
slug: replace-readme-logo-with-harnesshub-logo
title: Replace legacy README logo with HarnessHub logo
status: done
task_type: implementation
labels: docs,design
issue: 21
state_path: .codex/pm/issue-state/21-replace-readme-logo-with-harnesshub-logo.md
---

## Context

The repository rename from ClawPack to HarnessHub left the README logo on the old ClawPack branding, so the first visual shown to readers no longer matches the current project identity.


## Deliverable

Replace the legacy README logo with a HarnessHub-branded logo asset and point both README variants at the new asset.


## Scope

- remove the old ClawPack-branded README logo asset
- add a replacement HarnessHub logo asset suitable for repository display
- update `README.md` and `README_zh.md` to render the new logo

## Acceptance Criteria

- the old ClawPack logo is no longer rendered in either README
- the repository contains a HarnessHub-branded replacement logo asset
- the change stays limited to the README-facing branding asset swap

## Validation

- visual review of `README.md`
- visual review of `README_zh.md`

## Implementation Notes

Keep this issue limited to the README logo swap rather than expanding into broader branding system work.

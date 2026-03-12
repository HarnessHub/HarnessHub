---
type: issue_state
issue: 13
task: .codex/pm/tasks/product-direction/define-product-foundation-roadmap.md
title: Define ClawPack product foundation and architecture-aligned MVP/1.0 roadmap
status: in_progress
---

## Summary

Capture the product-definition work that reframes ClawPack from an OpenClaw-first packaging CLI into a broader harness image system with an architecture-consistent MVP and 1.0 path.

## Validated Facts

- the repository already has an implemented OpenClaw-first `inspect -> export -> import -> verify` loop
- the current docs do not yet fully unify that implementation with the broader harness image direction
- the product direction should preserve OpenClaw as the first adapter while removing OpenClaw as the conceptual product boundary

## Open Questions

- how much of the broader harness-image framing should be surfaced in the top-level README vs deeper docs

## Next Steps

- none; ready for review

## Artifacts

- issue #13
- `docs/prds/0002-product-foundation.md`
- `docs/prds/0003-roadmap-mvp-to-v1.md`
- `docs/architecture/0001-harness-image-architecture.md`

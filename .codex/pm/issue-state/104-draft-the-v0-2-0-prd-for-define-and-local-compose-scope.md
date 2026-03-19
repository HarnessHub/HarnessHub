---
type: issue_state
issue: 104
task: .codex/pm/tasks/product-direction/draft-the-v0-2-0-prd-for-define-and-local-compose-scope.md
title: Draft the v0.2.0 PRD for define-and-local-compose scope
status: done
delivery_stage: ready_to_deliver
---

## Summary

Draft a dedicated v0.2.0 PRD that turns the post-0.1.0 direction into a decision-complete product document.

## Validated Facts

- the repository currently has no `docs/prds/0004-...` document yet
- `docs/prds/0003-roadmap-mvp-to-v1.md` still described `v0.1.0` as if it were in release-closeout rather than already published
- the existing product and architecture docs already support a `0.2.0` framing centered on explicit definition plus narrow local composition
- issue decomposition for `0.2.0` already exists in GitHub as `#105` through `#109`, so this PRD should be specific enough to justify that breakdown

## Open Questions

-

## Next Steps

- define the v0.2.0 product goal after 0.1.0 GA
- position 0.2.0 as the define + local compose release
- lock in init + compose as the public CLI shape
- explicitly defer registry/catalog, second adapter, signing, and broad policy work
- make the document detailed enough to drive issue decomposition

## Artifacts

- `docs/prds/0002-product-foundation.md`
- `docs/prds/0003-roadmap-mvp-to-v1.md`
- `docs/architecture/0001-harness-image-architecture.md`
- `docs/architecture/0002-harness-capability-packaging.md`

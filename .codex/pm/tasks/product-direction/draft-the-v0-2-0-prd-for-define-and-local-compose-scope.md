---
type: task
epic: product-direction
slug: draft-the-v0-2-0-prd-for-define-and-local-compose-scope
title: Draft the v0.2.0 PRD for define-and-local-compose scope
status: done
task_type: implementation
labels: docs,prd
issue: 104
state_path: .codex/pm/issue-state/104-draft-the-v0-2-0-prd-for-define-and-local-compose-scope.md
---

## Context

Draft a dedicated v0.2.0 PRD that turns the post-0.1.0 direction into a decision-complete product document.

## Deliverable

Draft a dedicated v0.2.0 PRD that turns the post-0.1.0 direction into a decision-complete product document.

## Scope

- define the v0.2.0 product goal after 0.1.0 GA
- position 0.2.0 as the define + local compose release
- lock in init + compose as the public CLI shape
- explicitly defer registry/catalog, second adapter, signing, and broad policy work
- make the document detailed enough to drive issue decomposition

## Acceptance Criteria

- a new PRD exists under docs/prds for v0.2.0
- the PRD is consistent with current product foundation, roadmap, and architecture docs
- the PRD includes goals, non-goals, command shape, composition boundaries, and success criteria
- the existing roadmap/version framing is updated where needed so 0.1.0 is no longer described as pre-release closeout work

## Validation

- manual review against `docs/prds/0002-product-foundation.md`, `docs/prds/0003-roadmap-mvp-to-v1.md`, `docs/architecture/0001-harness-image-architecture.md`, and `docs/architecture/0002-harness-capability-packaging.md`
- `npm test`

## Implementation Notes

- add one dedicated `docs/prds/0004-...` PRD instead of overloading the roadmap doc
- update `0003-roadmap-mvp-to-v1.md` so `0.1.0` is clearly already released and `0.2.0` is the next defined line
- keep `0.2.0` scoped to explicit definition plus narrow local composition, not registry or second-adapter work

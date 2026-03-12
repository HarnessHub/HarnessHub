---
type: task
epic: product-direction
slug: evolve-manifest-into-explicit-harness-image-contract
title: Evolve manifest into explicit Harness image contract
status: done
task_type: implementation
labels: architecture,feature
issue: 24
state_path: .codex/pm/issue-state/24-evolve-manifest-into-explicit-harness-image-contract.md
---

## Context

The current manifest already carries enough data for the MVP lifecycle, but it still reads mostly like an export record. The contract needs explicit image identity and reserved lineage structure so future layering work has a stable place to grow.

## Deliverable

Extend the manifest into a clearer harness image contract with explicit image metadata and reserved lineage fields while preserving current import/export behavior.

## Scope

- add explicit image identity metadata distinct from source runtime metadata
- reserve manifest structure for future parent and layer lineage
- update import fallback and verification so the new contract is recognized without breaking older packs

## Acceptance Criteria

- the manifest includes explicit image identity metadata
- the manifest includes reserved lineage fields for future parent/layer work
- import and verify continue to work with current packs and legacy manifests

## Validation

- `npm run build`
- `npm test`

## Implementation Notes

Keep the current CLI surface stable. This issue evolves the contract shape without introducing composition behavior yet.

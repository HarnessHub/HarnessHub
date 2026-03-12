---
type: task
epic: product-direction
slug: codify-rebinding-surface-and-component-placement-in-the-image-spec
title: Codify rebinding surface and component placement in the image spec
status: done
task_type: implementation
labels: feature,design
issue: 46
state_path: .codex/pm/issue-state/46-codify-rebinding-surface-and-component-placement-in-the-image-spec.md
---

## Context

Promote rebinding rules and component placement from implementation detail to explicit harness image specification.

The current real artifact shows that workspace rebinding and top-level component placement already exist in practice, but the rules are still mostly inferred from code. Before future adapter expansion, HarnessHub should make these semantics first-class parts of the image spec.

## Deliverable

Promote rebinding rules and component placement from implementation detail to explicit harness image specification.

## Scope

- define which fields and paths are allowed to change during import-time rebinding
- define which top-level component locations are reserved by the image spec and which are adapter-specific
- align manifest language and verification behavior with the codified rebinding and placement rules

## Acceptance Criteria

- rebinding behavior is described as part of the image contract rather than only adapter logic
- component placement rules are explicit enough to support future adapter work without archive-layout drift
- manifest and verification semantics reflect the codified rules

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-agent-preflight.sh`

## Implementation Notes

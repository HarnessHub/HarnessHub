---
type: task
epic: product-direction
slug: define-explicit-template-vs-instance-image-contract
title: Define explicit template vs instance image contract
status: done
task_type: implementation
labels: feature,design
issue: 47
state_path: .codex/pm/issue-state/47-define-explicit-template-vs-instance-image-contract.md
---

## Context

Turn the current template vs instance distinction into an explicit image contract instead of leaving it as a mostly exclusion-list-driven behavior.

The real OpenClaw end-to-end artifact proved the packaging loop works, but it also showed that `template` still carries a mix of stateful components that are not yet governed by a strong semantic contract. Before broadening scope, HarnessHub should define exactly what a template image may and may not contain.

## Deliverable

Turn the current template vs instance distinction into an explicit image contract instead of leaving it as a mostly exclusion-list-driven behavior.

## Scope

- define allowed and forbidden component classes for `template` and `instance`
- clarify how inspect recommendations, risk levels, and user intent interact with pack type selection
- align export and verification behavior with the stronger pack-type contract

## Acceptance Criteria

- `template` and `instance` are defined as explicit image contracts, not only operational modes
- pack-type semantics are clear enough to explain why a real source may be recommended as `instance`
- export and verify behavior can enforce the distinction consistently

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-agent-preflight.sh`

## Implementation Notes

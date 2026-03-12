---
type: task
epic: product-direction
slug: define-export-policy-for-inspect-recommendations-warnings-and-hard-stops
title: Define export policy for inspect recommendations, warnings, and hard stops
status: done
task_type: implementation
labels: feature,design
issue: 51
state_path: .codex/pm/issue-state/51-define-export-policy-for-inspect-recommendations-warnings-and-hard-stops.md
---

## Context

Define the product policy that turns inspect recommendations and pack-type risk signals into explicit export behavior.

HarnessHub now has a stronger template vs instance contract, but users still need clearer product behavior when inspect recommends `instance` and export is asked to produce `template`. The CLI should make those boundaries predictable instead of relying only on free-form warnings.

## Deliverable

Define the product policy that turns inspect recommendations and pack-type risk signals into explicit export behavior.

## Scope

- define when export should warn, require explicit override, or refuse a pack-type choice
- align inspect recommendations with export defaults and user intent
- keep the first implementation aligned with the current OpenClaw-oriented MVP

## Acceptance Criteria

- export behavior is explicit when inspect recommendations and requested pack type diverge
- the user-facing contract is clearer than the current warning-only behavior
- the implementation remains within current MVP scope and does not require a new runtime adapter

## Validation

-

## Implementation Notes

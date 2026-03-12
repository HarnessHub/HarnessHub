---
type: task
epic: product-direction
slug: close-the-inspect-to-export-operator-workflow
title: Close the inspect-to-export operator workflow
status: done
task_type: implementation
labels: feature,docs,ux
issue: 59
state_path: .codex/pm/issue-state/59-close-the-inspect-to-export-operator-workflow.md
---

## Context

Make the inspect recommendation and export decision path feel like one coherent operator workflow.

HarnessHub now has safer export policy, but the operator still has to infer the recommended next export command after inspect.

## Deliverable

Make the inspect recommendation and export decision path feel like one coherent operator workflow.

## Scope

- define the canonical operator path from inspect recommendation to export choice
- surface the recommended next step in inspect and export UX or docs where appropriate
- update smoke or CLI coverage around the documented workflow

## Acceptance Criteria

- the default operator path from inspect to export is explicit
- template, instance, and override flows are documented and/or surfaced consistently
- the documented quick path matches actual CLI behavior

## Validation

-

## Implementation Notes

---
type: task
epic: product-direction
slug: introduce-explicit-openclaw-adapter-boundary
title: Introduce explicit OpenClaw adapter boundary
status: done
task_type: implementation
labels: architecture,feature
issue: 25
state_path: .codex/pm/issue-state/25-introduce-explicit-openclaw-adapter-boundary.md
---

## Context

The current MVP implementation already behaves like an OpenClaw-first adapter, but the runtime-specific responsibilities for state resolution, config discovery, workspace binding, inspection, and import-time rebinding are still coupled directly into generic pack and verify flows.

## Deliverable

Introduce an explicit OpenClaw adapter boundary so generic harness image flows depend on adapter methods rather than on scattered OpenClaw-specific helper calls.

## Scope

- introduce a small adapter interface for harness runtime adapters
- add an explicit `openClawAdapter` implementation for current OpenClaw-specific responsibilities
- route inspect, export, import, and verify flows through the adapter boundary without changing CLI behavior

## Acceptance Criteria

- OpenClaw-specific state/config/workspace and rebinding logic is reachable through an explicit adapter object
- generic pack and verify code no longer import those responsibilities directly from scanner helpers
- current build and tests remain green after the refactor

## Validation

- `npm run build`
- `npm test`

## Implementation Notes

This issue is about boundary clarity, not about introducing a second adapter yet.

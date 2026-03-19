---
type: task
epic: product-direction
slug: define-the-harness-definition-file-model-and-add-harness-init
title: Define the harness definition file model and add harness init
status: in_progress
task_type: implementation
issue: 106
state_path: .codex/pm/issue-state/106-define-the-harness-definition-file-model-and-add-harness-init.md
---

## Context

Introduce the first explicit harness definition workflow for the v0.2.0 line.

## Deliverable

Introduce the first explicit harness definition workflow for the v0.2.0 line.

## Scope

- define the repository-local harness definition file shape for v0.2.0
- add `harness init` as the public bootstrap command
- support creating a new definition in the current directory
- support bootstrapping a definition from an OpenClaw source path where appropriate

## Acceptance Criteria

- a stable v0.2.0 definition file shape exists in docs and code
- `harness init` can create a valid starter definition
- the definition captures image identity, adapter target, components, bindings, and verification intent
- tests cover new-definition and from-existing-source initialization paths

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-cli-smoke.sh`

## Implementation Notes

- Added `harness.definition.json` as the repository-local v0.2.0 definition file.
- Added `harness init` for starter and OpenClaw-bootstrap initialization flows.
- Added the definition spec at `docs/specs/0002-v0-2-0-harness-definition-file-specification.md`.

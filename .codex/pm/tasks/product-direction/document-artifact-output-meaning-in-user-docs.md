---
type: task
epic: product-direction
slug: document-artifact-output-meaning-in-user-docs
title: Document how to interpret harness CLI artifact outputs
status: in_progress
task_type: implementation
labels: docs
issue: 81
state_path: .codex/pm/issue-state/81-document-artifact-output-meaning-in-user-docs.md
---

## Context

The current MVP docs explain the `inspect -> export -> import -> verify` workflow, but they do not clearly explain how to read the JSON outputs or what the produced `.harness` artifact and related reports mean in practice.

## Deliverable

The current MVP docs explain the `inspect -> export -> import -> verify` workflow, but they do not clearly explain how to read the JSON outputs or what the produced `.harness` artifact and related reports mean in practice.

## Scope

- explain the main `inspect`, `export`, `import`, and `verify` JSON fields in user-facing docs
- explain what a produced `.harness` artifact proves in `template` vs `instance` mode
- document a self-serve OpenClaw migration validation path and what successful results look like

## Acceptance Criteria

- A reader can run the MVP commands and understand the meaning of the main output fields without reading the source code
- The docs clearly explain what value the generated artifact proves in a real OpenClaw packaging/migration flow
- The explanation lives in the canonical user-facing doc location rather than an ad hoc note

## Validation

- `npm test`
- `./scripts/run-cli-smoke.sh`

## Implementation Notes

- keep the explanation in canonical user docs (`README.md` and `README_zh.md`) instead of adding an isolated note

---
type: issue_state
issue: 106
task: .codex/pm/tasks/product-direction/define-the-harness-definition-file-model-and-add-harness-init.md
title: Define the harness definition file model and add harness init
status: in_progress
delivery_stage: implementing
---

## Summary

Introduce the first explicit harness definition workflow for the v0.2.0 line.

## Validated Facts

- a stable v0.2.0 definition file shape exists in docs and code
- `harness init` can create a valid starter definition
- the definition captures image identity, adapter target, components, bindings, and verification intent
- tests cover new-definition and from-existing-source initialization paths
- `harness.definition.json` is the default repository-local definition file name
- the OpenClaw bootstrap path infers components and workspace binding intent from the detected source

## Open Questions

-

## Next Steps

- self-review the implementation diff
- commit the issue changes
- refresh review checkpoint and open the PR

## Artifacts

- `docs/specs/0002-v0-2-0-harness-definition-file-specification.md`
- `src/core/definition.ts`
- `src/commands/init.ts`
- `test/harness-definition.test.ts`

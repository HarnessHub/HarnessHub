---
type: task
epic: product-direction
slug: validate-manifest-contract-explicitly-during-export-import-and-verify
title: Validate manifest contract explicitly during export, import, and verify
status: done
task_type: implementation
labels: feature,test
issue: 40
state_path: .codex/pm/issue-state/40-validate-manifest-contract-explicitly-during-export-import-and-verify.md
---

## Context

Make the harness image manifest contract explicitly validated during export, import, and verify so malformed images fail early with clear errors.

The manifest structure is now more explicit, but the current implementation still relies heavily on structural assumptions at call sites. Before broadening adapter support, the contract should be enforced directly so packaging behavior is predictable and errors are easier to diagnose.

## Deliverable

Make the harness image manifest contract explicitly validated during export, import, and verify so malformed images fail early with clear errors.

## Scope

- validate required manifest structure and key semantic fields during export, import, and verify
- improve failure messages when a `.harness` image does not satisfy the expected contract
- keep the work aligned with the current OpenClaw-oriented MVP rather than adding a second runtime family

## Acceptance Criteria

- malformed or incomplete manifest data fails with explicit contract errors
- export, import, and verify each enforce the manifest contract at their boundary
- the implementation remains compatible with current MVP scope and improves confidence in future adapter expansion

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-agent-preflight.sh`

## Implementation Notes

---
type: task
epic: product-direction
slug: make-import-and-verify-consume-explicit-binding-semantics
title: Make import and verify consume explicit binding semantics
status: done
task_type: implementation
labels: architecture,feature,test
issue: 26
state_path: .codex/pm/issue-state/26-make-import-and-verify-consume-explicit-binding-semantics.md
---

## Context

The MVP already performs import-time workspace rebinding, but the rebinding contract was still implicit in code paths and inferred mostly from filesystem behavior plus `workspaces` metadata.

## Deliverable

Represent binding semantics explicitly in the manifest and make import plus verify consume that contract directly.

## Scope

- add explicit binding semantics to the manifest
- drive import-time workspace rebinding from those manifest semantics
- validate binding expectations during verify rather than relying only on filesystem structure

## Acceptance Criteria

- the manifest declares explicit binding semantics for imported workspaces
- import consumes those semantics when rebinding config
- verify checks that the imported result satisfies binding expectations

## Validation

- `npm run build`
- `npm test`

## Implementation Notes

Keep the scope on binding semantics only. Do not introduce full parent/layer composition here.

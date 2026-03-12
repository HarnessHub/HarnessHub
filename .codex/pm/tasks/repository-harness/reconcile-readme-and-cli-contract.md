---
type: task
epic: repository-harness
slug: reconcile-readme-and-cli-contract
title: Reconcile README guarantees with actual CLI behavior
status: done
task_type: docs
labels: docs,test
issue: 8
state_path: .codex/pm/issue-state/8-reconcile-readme-and-cli-contract.md
---

## Context

The current README still makes some stronger claims than the implementation actually guarantees, especially around verify semantics and pack risk expectations.

## Deliverable

Update README and related docs so they match the implemented CLI semantics and the validation coverage that actually exists.

## Scope

- compare README workflow claims against current CLI behavior
- tighten wording where implementation is intentionally narrower
- add or adjust tests when documentation changes should stay locked in

## Acceptance Criteria

- the README no longer overclaims verify or risk-level behavior
- user-visible contract clarifications have matching validation coverage
- future harness and product work can rely on the docs as a truthful baseline

## Validation

- doc review against current command behavior
- `npm test` for any linked validation coverage

## Implementation Notes

This is a HarnessHub-specific correctness task, not a generic harness export task.

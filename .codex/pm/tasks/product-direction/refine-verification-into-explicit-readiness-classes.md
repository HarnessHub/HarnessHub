---
type: task
epic: product-direction
slug: refine-verification-into-explicit-readiness-classes
title: Refine verification into explicit readiness classes
status: done
task_type: implementation
labels: feature,design
issue: 53
state_path: .codex/pm/issue-state/53-refine-verification-into-explicit-readiness-classes.md
---

## Context

Refine verification semantics beyond a boolean runtime-ready signal into explicit readiness classes that describe what kind of follow-up, if any, is still required.

HarnessHub now distinguishes structural restore from runtime readiness, but the current runtime-ready model is still binary. A richer readiness model would make verify output more actionable without expanding runtime scope.

## Deliverable

Refine verification semantics beyond a boolean runtime-ready signal into explicit readiness classes that describe what kind of follow-up, if any, is still required.

## Scope

- define explicit readiness classes for imported images
- map current runtime-readiness issues into those classes
- update verification output and tests to reflect the clearer readiness model

## Acceptance Criteria

- verify output can express more than a simple ready/not-ready distinction
- current runtime-readiness issues are mapped into explicit readiness classes
- the model improves operator clarity while staying within the MVP image scope

## Validation

-

## Implementation Notes

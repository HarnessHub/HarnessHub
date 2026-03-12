---
type: task
epic: product-direction
slug: codify-harness-vs-agent-runtime-boundary
title: Codify harness vs agent runtime boundary in core docs
status: done
task_type: implementation
labels: docs,architecture
issue: 23
state_path: .codex/pm/issue-state/23-codify-harness-vs-agent-runtime-boundary.md
---

## Context

The product and architecture direction now rely on a clear distinction between the harness layer and the agent runtime layer, but that boundary was not yet captured explicitly in the canonical docs.

## Deliverable

Add explicit harness-versus-runtime definitions and boundary language to the core product foundation and architecture documents.

## Scope

- define `Agent Runtime` alongside `Harness` in the product foundation
- explain the practical runtime vs harness distinction in product-facing language
- add an architecture-level boundary clarification that keeps HarnessHub out of runtime-platform scope

## Acceptance Criteria

- the product foundation explicitly distinguishes harness from agent runtime
- the architecture doc explicitly states that HarnessHub packages the harness layer rather than replacing the runtime
- the wording is precise enough to guide future implementation issue decomposition

## Validation

- doc review against the MVP and 1.0 framing
- doc review against the architecture boundary needed for adapter work

## Implementation Notes

Keep this issue limited to codifying conceptual boundaries. Do not expand into runtime feature work or implementation refactors here.

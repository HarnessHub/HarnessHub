---
type: task
epic: product-direction
slug: codify-harnesshub-as-environment-capability-packaging-not-agent-packaging
title: Codify HarnessHub as environment capability packaging, not agent packaging
status: done
task_type: implementation
labels: docs,design
issue: 67
state_path: .codex/pm/issue-state/67-codify-harnesshub-as-environment-capability-packaging-not-agent-packaging.md
---

## Context

Codify the product and architecture decision that HarnessHub packages reusable environment capability rather than packaging an agent process itself.

Current docs define harness versus runtime, but they do not yet explicitly answer the deeper question of whether HarnessHub is packaging agents or packaging the environment capability that lets agents work reliably.

## Deliverable

Codify the product and architecture decision that HarnessHub packages reusable environment capability rather than packaging an agent process itself.

## Scope

- add one direction memo under docs/architecture/
- explain the decision with concrete OpenClaw, Codex, and Claude Code examples
- document direct implications for harness identity, layering, and runtime adapters

## Acceptance Criteria

- the repository contains one canonical decision memo for this boundary
- the memo is linked from the core product and architecture docs
- future product and 1.0 discussions can cite the memo instead of re-litigating the same question

## Validation

-

## Implementation Notes

---
type: task
epic: repository-harness
slug: harden-review-checkpoint-and-preflight-sequencing-guardrails
title: Harden review checkpoint and preflight sequencing guardrails
status: done
task_type: implementation
labels: tooling,guardrail
issue: 37
state_path: .codex/pm/issue-state/37-harden-review-checkpoint-and-preflight-sequencing-guardrails.md
---

## Context

Harden the local review checkpoint and preflight flow so normal agent sequencing does not fail on brittle `.codex-review` formatting and timestamp expectations.

The current guardrail catches real problems, but the sequence is still too fragile for autonomous delivery. Agents can pass review, build, and tests, then still fail on note format or proof ordering even when the actual code work is correct. That creates avoidable friction and slows issue throughput.

## Deliverable

Harden the local review checkpoint and preflight flow so normal agent sequencing does not fail on brittle `.codex-review` formatting and timestamp expectations.

## Scope

- tighten the local review note contract so the expected format is explicit and easy to satisfy
- reduce avoidable failures caused by normal checkpoint -> review note -> preflight sequencing
- keep the guardrail local to repository harness behavior rather than broadening product scope

## Acceptance Criteria

- normal issue delivery sequencing does not fail on avoidable `.codex-review` formatting mismatches
- review checkpoint and preflight expectations are clearer and more robust to normal agent use
- the change stays in local harness guardrails and does not affect public product behavior

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-agent-preflight.sh`

## Implementation Notes

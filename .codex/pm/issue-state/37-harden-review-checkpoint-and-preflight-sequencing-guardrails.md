---
type: issue_state
issue: 37
task: .codex/pm/tasks/repository-harness/harden-review-checkpoint-and-preflight-sequencing-guardrails.md
title: Harden review checkpoint and preflight sequencing guardrails
status: done
delivery_stage: ready_to_deliver
---

## Summary

Harden the local review checkpoint and preflight flow so normal agent sequencing does not fail on brittle `.codex-review` formatting and timestamp expectations.

The current guardrail catches real problems, but the sequence is still too fragile for autonomous delivery. Agents can pass review, build, and tests, then still fail on note format or proof ordering even when the actual code work is correct. That creates avoidable friction and slows issue throughput.

## Validated Facts

- normal issue delivery sequencing does not fail on avoidable `.codex-review` formatting mismatches
- review checkpoint and preflight expectations are clearer and more robust to normal agent use
- the change stays in local harness guardrails and does not affect public product behavior

## Open Questions

-

## Next Steps

- monitor the updated `head reviewed:` contract in normal issue delivery
- extend the review guardrail again only if a new repeated failure pattern appears

## Artifacts

-

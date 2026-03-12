---
type: issue_state
issue: 67
task: .codex/pm/tasks/product-direction/codify-harnesshub-as-environment-capability-packaging-not-agent-packaging.md
title: Codify HarnessHub as environment capability packaging, not agent packaging
status: backlog
---

## Summary

Codify the product and architecture decision that HarnessHub packages reusable environment capability rather than packaging an agent process itself.

Current docs define harness versus runtime, but they do not yet explicitly answer the deeper question of whether HarnessHub is packaging agents or packaging the environment capability that lets agents work reliably.

## Validated Facts

- the repository contains one canonical decision memo for this boundary
- the memo is linked from the core product and architecture docs
- future product and 1.0 discussions can cite the memo instead of re-litigating the same question

## Open Questions

-

## Next Steps

- add one direction memo under docs/architecture/
- explain the decision with concrete OpenClaw, Codex, and Claude Code examples
- document direct implications for harness identity, layering, and runtime adapters

## Artifacts

-

---
type: issue_state
issue: 67
task: .codex/pm/tasks/product-direction/codify-harnesshub-as-environment-capability-packaging-not-agent-packaging.md
title: Codify HarnessHub as environment capability packaging, not agent packaging
status: done
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

- cite the memo as the canonical product-boundary reference in future architecture and roadmap work

## Artifacts

- docs/architecture/0002-harness-capability-packaging.md
- merged in PR #68

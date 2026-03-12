---
type: issue_state
issue: 23
task: .codex/pm/tasks/product-direction/codify-harness-vs-agent-runtime-boundary.md
title: Codify harness vs agent runtime boundary in core docs
status: done
---

## Summary

Codify the conceptual boundary between harness and agent runtime in the canonical product and architecture docs so implementation work stays focused on the harness layer.

## Validated Facts

- HarnessHub is intended to package the application-layer harness rather than replace the runtime execution substrate
- future implementation issues depend on a stable wording for this distinction
- the needed doc changes live in `docs/prds/0002-product-foundation.md` and `docs/architecture/0001-harness-image-architecture.md`

## Open Questions

- none

## Next Steps

- none; ready for PR

## Artifacts

- issue #23
- `docs/prds/0002-product-foundation.md`
- `docs/architecture/0001-harness-image-architecture.md`

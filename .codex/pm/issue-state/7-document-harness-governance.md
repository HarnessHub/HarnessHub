---
type: issue_state
issue: 7
task: .codex/pm/tasks/repository-harness/document-harness-governance.md
title: Document repository harness governance and daily workflow
status: done
---

## Summary

Consolidate the daily ClawPack harness workflow into a clear contributor-facing governance path and record the execution plan for issues `#6`, `#7`, and `#8`.

## Validated Facts

- ClawPack now has local PM workflow, hook, preflight, and CLI smoke scripts, but the daily usage rules are still spread across multiple files.
- The local task twins for GitHub issues `#6` and `#7` were initially swapped and have been corrected before implementation continued.

## Open Questions

- How much governance detail belongs in `AGENTS.md` versus dedicated engineering docs?

## Next Steps

- continue `#6` on its own branch for command-level CLI validation
- continue `#8` on its own branch for README and contract reconciliation

## Artifacts

- `.codex/pm/updates/`
- `docs/engineering/repository-governance.md`
- `docs/engineering/tooling-setup.md`
- `AGENTS.md`

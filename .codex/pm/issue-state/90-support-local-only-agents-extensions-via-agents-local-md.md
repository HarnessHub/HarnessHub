---
type: issue_state
issue: 90
task: .codex/pm/tasks/repository-harness/support-local-only-agents-extensions-via-agents-local-md.md
title: Support local-only AGENTS extensions via .agents.local.md
status: done
delivery_stage: ready_to_deliver
---

## Summary

HarnessHub currently relies on the tracked `AGENTS.md` file for repository-wide agent instructions. For personal local workflows, that is awkward: some instructions are intentionally local-only, such as always loading a research skill like `openprecedent-harnesshub-validation` during local development, and should not be committed to the shared repository.

We should support a local-only AGENTS extension path so contributors can add private instructions on their own machines without modifying the tracked `AGENTS.md` content that gets pushed upstream.

## Validated Facts

- the tracked `AGENTS.md` can mention `.agents.local.md` as an optional local overlay without requiring the file to exist
- clone-local setup can keep `.agents.local.md` contents and `.git/info/exclude` changes out of the tracked repository diff

## Open Questions

-

## Next Steps

- update `AGENTS.md` with the optional local overlay rule
- keep clone-local `.agents.local.md` setup outside the tracked repository diff

## Artifacts

- `AGENTS.md`

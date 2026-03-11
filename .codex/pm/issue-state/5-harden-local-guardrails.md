---
type: issue_state
issue: 5
task: .codex/pm/tasks/repository-harness/harden-local-guardrails.md
title: Harden local harness guardrails for everyday use
status: done
---

## Summary

Harden the everyday local harness path by reducing Git noise from review artifacts and by extending pre-push guardrail coverage for stale proof and merged branch behavior.

## Validated Facts

- `.codex-review` and `.codex-review-proof` were showing up as ordinary untracked files before being added to `.gitignore`.
- The existing pre-push tests covered missing proof and closure-sync mismatch, but not stale proof or merged-branch reuse.
- The merged-branch reuse test needs an `upstream` remote in the fixture repo because the hook derives the target repo from `upstream`.

## Open Questions

- Should future harness work add a dedicated policy doc for local-only workflow artifacts beyond this brief note in tooling setup?

## Next Steps

- use the updated guardrail coverage as baseline for later harness tasks
- keep the future governance and CLI-validation work split into their own issue-scoped branches

## Artifacts

- `.gitignore`
- `test/pre-push-hook.test.ts`
- `docs/engineering/tooling-setup.md`

---
type: issue_state
issue: 3
task: .codex/pm/tasks/repository-harness/bootstrap-ccpm-codex.md
title: Bootstrap local ccpm-codex and harness guardrails
status: done
---

## Summary

Bootstrap the reusable harness core first so later HarnessHub harness tasks can use the same issue-task-PR flow.

## Validated Facts

- HarnessHub had no `.githooks/`, no `scripts/` harness layer, and no local issue-state support.
- OpenPrecedent's reusable value is primarily workflow, guardrails, and validation structure rather than product-specific research features.
- The first harness bootstrap issue is GitHub issue `#3`.

## Open Questions

- Which future HarnessHub-specific harness tasks should become the next child tasks under `repository-harness`?

## Next Steps

- use the new local PM flow for the next HarnessHub harness issue
- split follow-up harness work into reusable guardrails vs HarnessHub-specific validation tasks
- decide which next issue should harden PR closure sync and merged-branch checks in everyday use

## Artifacts

- `scripts/codex-pm.mjs`
- `.githooks/pre-push`
- `scripts/run-agent-preflight.sh`
- `scripts/run-cli-smoke.sh`

---
type: issue_state
issue: 33
task: .codex/pm/tasks/repository-harness/add-repo-local-skill-for-issue-scoped-execution-workflow.md
title: Add repo-local skill for issue-scoped execution workflow
status: done
delivery_stage: ready_to_deliver
---

## Summary

Add a repo-local skill that captures the correct issue-scoped execution sequence so future agent sessions do not need to reconstruct the workflow from memory.

## Validated Facts

- repeated agent friction came from workflow ordering rather than product code
- the repository already has CCPM and guardrail primitives, but not one skill that sequences them for one issue
- this capability belongs in progressively disclosed skills before more repository scripts are added

## Open Questions

- none

## Next Steps

- none; ready for PR

## Artifacts

- issue #33
- `.codex/skills/harness-issue-execution/SKILL.md`
- `AGENTS.md`

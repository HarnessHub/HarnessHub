---
type: issue_state
issue: 31
task: .codex/pm/tasks/repository-harness/add-repo-local-skill-for-multi-issue-delivery-sessions.md
title: Add repo-local skill for multi-issue delivery sessions
status: done
delivery_stage: ready_to_deliver
---

## Summary

Add a repo-local skill for chaining several issue deliveries safely so autonomous sessions stop reusing merged branches or stale bases.

## Validated Facts

- multi-issue sessions need different workflow guidance than one-issue execution
- the repeated mistakes are branch-lifecycle mistakes rather than product bugs
- the repository already enforces one issue per branch; the skill should teach how to honor that rule across several issues

## Open Questions

- none

## Next Steps

- none; ready for PR

## Artifacts

- issue #31
- `.codex/skills/harness-multi-issue-delivery/SKILL.md`
- `AGENTS.md`

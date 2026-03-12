---
type: task
epic: repository-harness
slug: add-repo-local-skill-for-issue-scoped-execution-workflow
title: Add repo-local skill for issue-scoped execution workflow
status: done
task_type: implementation
labels: tooling,feature
issue: 33
state_path: .codex/pm/issue-state/33-add-repo-local-skill-for-issue-scoped-execution-workflow.md
---

## Context

Autonomous delivery sessions keep hitting the same workflow friction: branch setup, PM twin sync, review-proof ordering, preflight timing, and PR timing are all correct but too easy to get wrong when they depend on memory.


## Deliverable

Add a repo-local skill that gives agents one clear issue-scoped execution sequence from issue start through merge.


## Scope

- create a repository-local skill for one-issue execution
- encode branch, task, issue-state, review/proof, preflight, push, PR, and merge ordering
- expose the skill in agent guidance without expanding normal contributor-facing docs

## Acceptance Criteria

- the repository has a dedicated skill for issue-scoped execution
- the skill covers the repeated timing mistakes observed in autonomous delivery
- the guidance stays agent-oriented rather than becoming general repository scripting

## Validation

- manual review of the skill against the repository governance and CCPM flow

## Implementation Notes

Keep this skill narrow. A separate skill should handle multi-issue chaining.

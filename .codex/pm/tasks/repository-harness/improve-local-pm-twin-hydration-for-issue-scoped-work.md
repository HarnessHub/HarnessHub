---
type: task
epic: repository-harness
slug: improve-local-pm-twin-hydration-for-issue-scoped-work
title: Improve local PM twin hydration for issue-scoped work
status: done
task_type: implementation
labels: tooling,feature
issue: 32
state_path: .codex/pm/issue-state/32-improve-local-pm-twin-hydration-for-issue-scoped-work.md
---

## Context

Improve local PM twin hydration so GitHub issue scope can be reflected into task and issue-state files with less manual copy-editing during implementation startup.

The local CCPM harness has the right structure, but the startup cost is still too manual: task files and issue-state files begin mostly empty, then require repeated hand-filling before they become useful. That slows down autonomous sessions and creates more chances for drift between remote issue state and local PM state.

## Deliverable

Improve local PM twin hydration so GitHub issue scope can be reflected into task and issue-state files with less manual copy-editing during implementation startup.

## Scope

- improve repository-local PM workflows so new task twins can be hydrated from issue intent more effectively
- reduce the amount of repeated manual boilerplate needed for Context, Scope, Acceptance Criteria, and Next Steps
- keep the solution local to the repository harness and compatible with the current CCPM flow

## Acceptance Criteria

- creating a local task twin requires less manual follow-up to become useful
- issue-state initialization reflects active issue context more directly
- the improvement stays repository-local and does not change public product behavior

## Validation

- `npm test`
- `npx vitest run test/codex-pm.test.ts`
- `npm run build`

## Implementation Notes

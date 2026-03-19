---
type: task
epic: repository-harness
slug: document-branching-and-release-line-governance
title: Document branching and release-line governance for stable versions
status: in_progress
task_type: implementation
labels: docs,release
issue: 110
state_path: .codex/pm/issue-state/110-document-branching-and-release-line-governance.md
---

## Context

Document the repository branch model now that HarnessHub has shipped `0.1.0` and needs a clearer relationship between `main`, feature branches, and version release lines.

## Deliverable

Document the repository branch model now that HarnessHub has shipped `0.1.0` and needs a clearer relationship between `main`, feature branches, and version release lines.

## Scope

- define the long-lived role of `main`
- define when to create `release/x.y` branches
- define how issue branches should choose their base branch
- define how fixes are backported between `main` and release branches
- define whether release branches are short-lived or kept for `x.y.z` patch maintenance
- add an explicit reference from `AGENTS.md` so future coding agents follow the branching/release governance by default

## Acceptance Criteria

- the repository contains a documented branching and release-line governance policy
- the policy is aligned with the current HarnessHub issue-per-branch workflow
- the policy clearly explains the relationship between `main` and `release/x.y`
- the policy gives contributors explicit guidance for future `0.2.x`, `0.3.x`, and similar release lines
- `AGENTS.md` references this governance policy so future agents follow the same branch and release-line rules

## Validation

- manual review against `docs/engineering/repository-governance.md`, `docs/engineering/tooling-setup.md`, and `AGENTS.md`
- confirm local hook and preflight base-ref override behavior from `.githooks/pre-push` and `scripts/run-agent-preflight.sh`
- `npm test`

## Implementation Notes

- keep `main` as the default branch for normal issue work
- document `release/x.y` as a just-in-time stabilization and patch-maintenance branch, not a permanent `develop` line
- make sure `AGENTS.md` points future agents to the new branching governance doc

---
type: task
epic: repository-harness
slug: bootstrap-ccpm-codex
title: Bootstrap local ccpm-codex and harness guardrails
status: done
task_type: implementation
labels: feature,tooling,test
issue: 3
state_path: .codex/pm/issue-state/3-bootstrap-ccpm-codex.md
---

## Context

ClawPack needs a repository-local PM workflow, issue state, hook guardrails, and smoke validation before broader harness work can proceed safely.

## Deliverable

Add local PM tooling, hook/preflight scripts, and a standard CLI smoke validation path without making ClawPack depend on OpenPrecedent.

## Scope

- add repository-local PM/task/state tooling
- add review checkpoint, pre-push, and preflight scripts
- add CLI smoke validation
- update docs and agent guidance

## Acceptance Criteria

- local PM commands scaffold and render task documents
- pre-push blocks missing review proof and stale merged branches
- preflight runs build, tests, and optional smoke checks
- import persists manifest so CLI verify can validate imported packs

## Validation

- `npm run build`
- `npm test`
- `./scripts/run-cli-smoke.sh`

## Implementation Notes

Use Node-based local scripts so the harness remains self-contained for a TypeScript CLI repository.

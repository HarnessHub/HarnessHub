---
type: task
epic: repository-harness
slug: stabilize-coverage-workflow-dependency-installation
title: Stabilize coverage workflow dependency installation
status: in_progress
task_type: implementation
labels: ci,quality,test
issue: 79
state_path: .codex/pm/issue-state/79-stabilize-coverage-workflow-dependency-installation.md
---

## Context

The new GitHub coverage workflow can fail during dependency installation on GitHub Actions even when the repository installs cleanly locally with `npm ci`. When that happens, the coverage step cannot find `vitest` and the workflow stops before publishing any coverage output.

## Deliverable

Stabilize coverage workflow dependency installation

## Scope

- reproduce and diagnose the GitHub Actions installation failure
- apply the smallest workflow-side fix that keeps coverage reporting intact
- move the install fallback logic into one repository-local script so the behavior is testable

## Acceptance Criteria

- the coverage workflow can complete dependency installation on GitHub Actions
- the workflow still runs coverage, publishes the summary, and uploads the artifact
- the change does not weaken the actual coverage reporting behavior
- the fallback logic is covered by a repository-local regression test

## Validation

- `npx vitest run test/install-ci-deps-script.test.ts`
- `npm test`

## Implementation Notes

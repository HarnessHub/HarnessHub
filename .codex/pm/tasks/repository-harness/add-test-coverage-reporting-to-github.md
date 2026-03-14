---
type: task
epic: repository-harness
slug: add-test-coverage-reporting-to-github
title: Add test coverage reporting and surface it clearly on GitHub
status: done
task_type: implementation
labels: test,quality,ci
issue: 77
state_path: .codex/pm/issue-state/77-add-test-coverage-reporting-to-github.md
---

## Context

HarnessHub currently has a healthy test suite but no coverage instrumentation or GitHub-visible coverage reporting. That makes it easy to know whether tests pass, but hard to see how much of the implementation is exercised and whether coverage is improving or regressing over time.

## Deliverable

Add test coverage reporting and surface it clearly on GitHub

## Scope

- enable coverage collection in the existing Vitest-based test path
- produce a machine-readable coverage artifact suitable for GitHub consumption
- expose coverage clearly in GitHub, such as through a PR check summary, uploaded artifact, or coverage comment
- document the local command path for generating and reviewing coverage
- keep the solution repository-local and compatible with the current CI and guardrail flow

## Acceptance Criteria

- contributors can run one local command to generate a coverage report
- GitHub surfaces test coverage for the repository or PR in a way that is easy to find without digging through raw logs
- the chosen reporting path is automated enough to catch coverage regressions during normal development
- the implementation does not replace or weaken the existing build, test, smoke, preflight, or OpenClaw validation checks

## Validation

- run the coverage command locally and confirm it emits the expected report format
- verify the GitHub-facing reporting path with repository documentation or workflow output
- run `npm test`

## Implementation Notes

Prefer a minimal path that fits the current toolchain. Start by using Vitest coverage output and only add external reporting services if GitHub-native visibility is insufficient.

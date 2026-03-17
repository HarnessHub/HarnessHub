---
type: task
epic: repository-harness
slug: support-local-only-agents-extensions-via-agents-local-md
title: Support local-only AGENTS extensions via .agents.local.md
status: done
task_type: implementation
issue: 90
state_path: .codex/pm/issue-state/90-support-local-only-agents-extensions-via-agents-local-md.md
---

## Context

HarnessHub currently relies on the tracked `AGENTS.md` file for repository-wide agent instructions. For personal local workflows, that is awkward: some instructions are intentionally local-only, such as always loading a research skill like `openprecedent-harnesshub-validation` during local development, and should not be committed to the shared repository.

We should support a local-only AGENTS extension path so contributors can add private instructions on their own machines without modifying the tracked `AGENTS.md` content that gets pushed upstream.

## Deliverable

HarnessHub currently relies on the tracked `AGENTS.md` file for repository-wide agent instructions. For personal local workflows, that is awkward: some instructions are intentionally local-only, such as always loading a research skill like `openprecedent-harnesshub-validation` during local development, and should not be committed to the shared repository.

We should support a local-only AGENTS extension path so contributors can add private instructions on their own machines without modifying the tracked `AGENTS.md` content that gets pushed upstream.

## Scope

- update the tracked `AGENTS.md` so agents also read `.agents.local.md` when that local file exists
- keep `.agents.local.md` itself clone-local and untracked
- keep personal local instructions out of the shared repository contract

## Acceptance Criteria

- the tracked `AGENTS.md` mentions `.agents.local.md` as an optional local overlay when present
- the repository change does not require `.agents.local.md` to exist
- personal local instructions can remain outside commits in each contributor clone

## Validation

- inspect `AGENTS.md` and confirm the local overlay rule is stated

## Implementation Notes

- this issue intentionally keeps clone-local setup such as `.agents.local.md` contents and `.git/info/exclude` changes out of the tracked repository diff

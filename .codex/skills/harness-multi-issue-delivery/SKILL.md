---
name: harness-multi-issue-delivery
description: Use when one session needs to deliver several HarnessHub issues in sequence without reusing merged branches or drifting from the latest upstream main.
---

# Harness Multi-Issue Delivery

Use this skill when the session goal includes more than one issue branch.

Do not use it for a single issue. For one issue at a time, use `harness-issue-execution`.

## Goal

Chain issue delivery safely without scope bleed, merged-branch reuse, or stale-base mistakes.

## Sequence

1. Decide the issue order up front.
2. Treat each issue as a separate branch and a separate PR.
3. After each merge:
   - stop using the merged branch
   - fetch `upstream`
   - restart from the latest `upstream/main`
4. Start the next issue on a fresh branch only after the previous issue is merged or deliberately paused.

## Rules

- Never append a new issue onto a branch whose PR already merged.
- Never keep working on an outdated branch base when the previous issue already landed.
- Keep one issue per branch and one issue per PR even if the same session handles several issues.
- Keep local task twins separate and issue-scoped.

## Recommended Loop

For each issue in the session:

1. Start from the latest `upstream/main`.
2. Create the dedicated issue branch.
3. Run the issue through `harness-issue-execution`.
4. Merge the PR.
5. Return to the latest `upstream/main`.
6. Start the next issue fresh.

## Handoff Rules

- If you stop mid-session, record the current issue-state before switching context.
- Do not leave several active issues half-implemented on one branch.
- If work for the next issue depends on the previous PR merging, wait for the merge before continuing.

## Not This Skill

- For one issue at a time, use `harness-issue-execution`.
- For repeated workflow failures that should become hard guardrails, use `harness-gap-closure`.

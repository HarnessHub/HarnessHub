# Branching And Release-Line Governance

## Purpose

HarnessHub keeps `main` stable by default while still allowing future minor versions to stabilize on dedicated release lines when needed.

This document defines the relationship between:

- `main`
- short-lived issue branches
- `release/x.y` branches for stable version lines

## Branch Roles

### `main`

`main` is the only long-lived integration branch.

It represents:

- the next version under active development
- the default base branch for normal issue work
- the branch that should stay buildable and testable at all times

Unless a version already has an active release branch, issue work should start from the latest `upstream/main`.

### Issue Branches

Issue branches remain short-lived and issue-scoped:

- one issue per branch
- one issue per pull request
- branch names should continue following the `issue-<n>-<slug>` pattern

An issue branch must start from the latest commit on its target integration line:

- usually `upstream/main`
- `upstream/release/x.y` when doing stabilization or patch work for an active release line

### `release/x.y`

`release/x.y` is a stable version-line branch for one minor release series such as `0.2.x`.

It is not a long-lived `develop` branch.

It exists only when a minor version needs:

- release-candidate stabilization
- GA closeout on a stable line
- later `x.y.z` patch maintenance after GA

## When To Create A Release Branch

Do not create `release/x.y` at the start of normal feature development.

Create it just in time, when:

- the planned `x.y.0` feature set is effectively frozen
- the team is entering RC or stabilization work
- `main` needs to reopen for the next version while `x.y` still needs focused release work

Example:

- normal `0.2.0` feature work lands on `main`
- when `0.2.0` is ready for RC hardening, cut `release/0.2` from the current stable point on `main`
- after that, `release/0.2` owns `0.2.0`, `0.2.1`, and later `0.2.x` patches if they are needed

## Relationship Between `main` And `release/x.y`

`main` and `release/x.y` are not parallel long-lived development branches with equal scope.

Their relationship is:

- `main` continues forward toward the next version
- `release/x.y` is the constrained stable line for one minor series

In practice:

- new feature work goes to `main`
- stabilization and patch work for `x.y` goes to `release/x.y`
- `release/x.y` should not become the place for ordinary next-version feature development

## Fix Flow And Backports

Default fix policy:

1. fix on `main` first
2. backport to `release/x.y` only when the fix is needed on that stable line

Preferred backport method:

- cherry-pick the reviewed fix from `main` onto `release/x.y`

Why:

- `main` remains the source of truth for ongoing development
- stable branches receive only the fixes they actually need
- the release line does not drift into a second general-purpose development branch

## What Is Allowed On A Release Branch

Allowed on `release/x.y`:

- RC stabilization fixes
- release-note or version-line corrections
- patch-release fixes for regressions, security issues, or important operator-facing defects
- documentation updates that are specific to that stable line

Not allowed on `release/x.y` by default:

- unrelated new features
- broad refactors for future architecture work
- speculative cleanup that does not directly help the `x.y` line ship or stay healthy

## Patch Maintenance Policy

Keep `release/x.y` after GA only if the project expects `x.y.z` follow-up releases.

If the project does not intend to maintain that line:

- tag and ship the final release
- then the branch may be deleted

If the project does intend to maintain that line:

- keep `release/x.y`
- use it only for `x.y.z` maintenance

## Agent And Contributor Rules

When choosing a base branch:

- default to `upstream/main`
- switch to `upstream/release/x.y` only when the issue explicitly belongs to an active stable line

When doing release-line work:

- do not branch from an outdated local branch
- branch from the latest remote target line
- keep one issue per branch and one issue per PR
- do not continue work on a branch whose PR has already merged

## Local Tooling Notes

The local hook and preflight scripts default to `upstream/main` for branch-freshness checks.

For release-line work, set the base ref explicitly:

```bash
HARNESSHUB_BASE_REF=upstream/release/0.2 git push
HARNESSHUB_PREFLIGHT_BASE_REF=upstream/release/0.2 ./scripts/run-agent-preflight.sh
HARNESSHUB_REVIEW_BASE_REF=upstream/release/0.2 ./scripts/run-codex-review-checkpoint.sh
```

Use the matching `release/x.y` ref for the version line you are maintaining.

## Default Policy For HarnessHub

Until the repository explicitly creates an active `release/x.y` branch:

- `main` is the only target integration line
- all normal issue branches should start from the latest `upstream/main`
- release branches are created later, near stabilization, not preemptively

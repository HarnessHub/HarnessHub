---
type: task
epic: product-direction
slug: update-harnesshub-metadata
title: Update repository metadata and remotes after HarnessHub migration
status: in_progress
task_type: implementation
labels: docs,chore
issue: 15
state_path: .codex/pm/issue-state/15-update-harnesshub-metadata.md
---

## Context

The project has been renamed and migrated to `HarnessHub/HarnessHub`, and the fork has moved to `yaoyinnan/HarnessHub`. The local remotes and repository metadata should match that rename.


## Deliverable

Update local remotes, repository metadata, and visible repository descriptions so the repo consistently points at the HarnessHub locations.


## Scope

- repoint local `origin` and `upstream`
- update repository metadata URLs and descriptions in tracked files
- update local workflow defaults that still point to the old repository
- apply the same GitHub repository description to the upstream repo and the fork

## Acceptance Criteria

- local git remotes point to the renamed repositories
- tracked repository metadata no longer points to `Mrxuexi/clawpack` or `yaoyinnan/clawpack`
- both GitHub repositories use the same updated description

## Validation

- `npm test`
- `git remote -v`

## Implementation Notes

Keep the current CLI name `clawpack` unchanged in this issue to avoid mixing repository migration with package-level breaking changes.

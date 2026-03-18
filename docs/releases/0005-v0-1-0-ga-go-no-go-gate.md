# HarnessHub v0.1.0 GA Go/No-Go Gate

## Status

Current post-RC decision gate for promoting HarnessHub from the published `v0.1.0-rc.1` baseline to `v0.1.0`.

This document exists because the MVP gate and the RC publish runbook answer different questions:

- [0001-mvp-exit-criteria.md](./0001-mvp-exit-criteria.md) says when the repository is mature enough to cut an RC
- [0003-v0-1-0-rc-1-runbook.md](./0003-v0-1-0-rc-1-runbook.md) says how to publish that RC

This document says when the published RC has earned promotion to GA.

## Decision Intent

`0.1.0` should mean that the published HarnessHub package and docs are stable enough to recommend without RC caveats for the current OpenClaw-first scope.

That does not mean the project is feature-complete for 1.0 ambitions. It means:

- the published `harness` CLI behaves as documented for the supported `inspect -> export -> import -> verify` lifecycle
- the release candidate has no known defects that should cause a careful operator to wait for another RC
- the repository has enough post-RC evidence to remove the release-candidate qualifier honestly

## Required GA Evidence

All of the following must be true before shipping `0.1.0`.

### 1. Published RC Validation Still Holds

- the RC publication remains externally visible on GitHub and npm
- the repository still records a successful published-package validation path in `docs/validation/fresh-operator-validation.md`
- the repository still records a successful real OpenClaw validation path in `docs/validation/openclaw-e2e-validation.md`
- the README install path and release notes still match the actual published package behavior

### 2. Candidate Gate Still Passes

The GA candidate commit must pass the same local release gate that justified the RC:

```bash
npm run build
npm test
./scripts/run-agent-preflight.sh
./scripts/run-cli-smoke.sh
./scripts/run-openclaw-e2e-validation.sh
npm run fresh-operator
```

Expected result:

- all commands succeed
- generated validation records reflect the intended GA candidate state
- no unexpected dirty-worktree drift remains after reviewing validation artifact updates

### 3. No Open GA Blocker Defects Exist

There must be no known issue that makes the published package misleading, unsafe, or unreliable for the current supported scope.

Examples of GA blockers:

- the published npm package cannot run the documented CLI path from a fresh install
- `inspect`, `export`, `import`, or `verify` regress from the documented OpenClaw-first happy path
- manifest, pack-type, rebinding, or readiness semantics drift from the documented contract without aligned spec and test updates
- release notes, changelog, or README materially misstate what the published package does
- a post-RC fix is required to remove an operator-visible workaround from the supported flow

### 4. Remaining Open Work Fits Accepted Non-Blockers

Open items are acceptable only if they are clearly outside the MVP/GA promise.

Examples of non-blockers:

- adding another runtime adapter
- registry or catalog primitives
- layered parent-image activation
- hosted UI or SaaS behavior
- future docs refinement that does not change current package behavior

## Current Classification After `v0.1.0-rc.1`

Current validated evidence in the repository:

- the RC has been published to GitHub and npm
- the published-package fresh-install path has been validated through issue `#98`
- the real OpenClaw end-to-end validation record exists and remains part of the release baseline
- no separate open bug issue currently exists for an RC-breaking defect

Current open items:

- `#97` is the umbrella post-RC closeout issue
- `#102` is the execution issue for the final `0.1.0` release closeout

Current classification:

- `#97` is coordination work, not by itself a GA blocker
- `#102` is release execution work, not by itself evidence that another RC is required
- no separate known product or packaging bug is currently recorded as a GA blocker

## Decision Rule: `0.1.0` vs `0.1.0-rc.2`

Promote directly to `0.1.0` when all of the following are true:

1. the required GA evidence above is still satisfied on the GA candidate commit
2. no new operator-visible defect has been discovered since `v0.1.0-rc.1`
3. no release-note or install-path correction requires changing the shipped package semantics

Cut `0.1.0-rc.2` instead when any of the following are true:

1. a fix is required to the published package, CLI behavior, or supported operator flow
2. the documented install or acceptance path requires correction beyond wording-only clarification
3. a newly discovered issue should reasonably cause an operator to wait for another candidate before trusting `0.1.0`

## Current Recommendation

Based on the repository state after issue `#98`, the current recommendation is:

- do not cut `0.1.0-rc.2` by default
- promote to `0.1.0` once the GA candidate commit re-passes the release gate and no new RC blocker emerges from post-RC observation

Stated differently:

- the current evidence favors direct promotion to `0.1.0`
- the trigger for `0.1.0-rc.2` should be a newly discovered blocker, not a desire for another RC in the abstract

## Closeout Action

When the team makes the final go/no-go call:

- record the decision in issue `#97`
- if GA is approved, prepare the final `0.1.0` release closeout using the same gate discipline as the RC
- if another RC is required, open a dedicated release issue for `0.1.0-rc.2` rather than extending `#97` indefinitely

## References

- [0001-mvp-exit-criteria.md](./0001-mvp-exit-criteria.md)
- [0002-mvp-release-candidate.md](./0002-mvp-release-candidate.md)
- [0003-v0-1-0-rc-1-runbook.md](./0003-v0-1-0-rc-1-runbook.md)
- [0004-v0-1-0-rc-1-notes.md](./0004-v0-1-0-rc-1-notes.md)
- [0006-v0-1-0-ga-runbook.md](./0006-v0-1-0-ga-runbook.md)
- [0007-v0-1-0-notes.md](./0007-v0-1-0-notes.md)
- `docs/validation/fresh-operator-validation.md`
- `docs/validation/openclaw-e2e-validation.md`

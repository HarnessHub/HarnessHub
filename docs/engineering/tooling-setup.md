# Tooling Setup

## Repository-Local Setup

The repository now includes:

- a local Git pre-push hook that requires a Codex review note and review proof
- `scripts/run-codex-review-checkpoint.sh` as the local checkpoint for invoking native Codex `/review`
- `scripts/run-agent-preflight.sh` for the standard local pre-push confidence checks
- `scripts/run-cli-smoke.sh` for the standard CLI smoke validation path
- `node scripts/codex-pm.mjs issue-state-init <task-path>` for preserving issue-scoped state across longer work
- `node scripts/codex-pm.mjs issue-deliver <task-path> --issue <n> --tests "npm test"` for the default push-and-PR finish path

For the full daily workflow and repository rules, see:

- `docs/engineering/repository-governance.md`

To enable the local hook:

```bash
./scripts/install-hooks.sh
```

After that, each push requires both a `.codex-review` file and a current `.codex-review-proof` file in the repository root unless you explicitly bypass the hook. The hook also expects your branch to contain the latest `upstream/main` by default.
These two files are local review artifacts for the current branch and should stay untracked in normal development.

## Codex Review Hook

Before pushing, run:

```bash
./scripts/run-codex-review-checkpoint.sh
```

Then update `.codex-review` with a short review note:

```text
scope reviewed: hook and preflight changes
head reviewed: <current HEAD sha>
findings: no findings
remaining risks: smoke validation was not run locally
```

## Merge Validation

For the standard local readiness pass before push, run:

```bash
./scripts/run-agent-preflight.sh
```

This checks the local review note, review proof, merged-branch reuse, issue-state, delivery completeness for done issue branches, build, tests, and local PR closure sync when `gh` can resolve the current PR body.

A normal issue-scoped path is:

1. `./scripts/run-codex-review-checkpoint.sh`
2. update `.codex-review` with real findings and keep `head reviewed:` aligned with the current commit
3. `./scripts/run-agent-preflight.sh`
4. `node scripts/codex-pm.mjs issue-deliver .codex/pm/tasks/<epic>/<task>.md --issue <n> --tests "npm test"`

Set `HARNESSHUB_PREFLIGHT_RUN_SMOKE=1` if you also want the CLI smoke path included in the same pass.

## Issue-Scoped Development State

For longer-running issues, initialize a local state document from the matching task twin:

```bash
node scripts/codex-pm.mjs issue-state-init .codex/pm/tasks/<epic>/<task>.md
```

Use it to keep validated facts, open questions, next steps, and key artifacts in one stable place as the work evolves across sessions. The issue-state metadata also records `delivery_stage` and `pr_url` so a fresh session can tell whether the issue is still being implemented, is ready to deliver, or already has an open PR.

## CLI Smoke Validation

For a standard documented-user-path validation, run:

```bash
./scripts/run-cli-smoke.sh
```

This validates the public `inspect -> export -> import -> verify` path against a temporary OpenClaw-style fixture and requires `verify` to load the persisted imported manifest.

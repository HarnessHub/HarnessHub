# Tooling Setup

## Repository-Local Setup

The repository now includes:

- a local Git pre-push hook that requires a Codex review note and review proof
- `scripts/run-codex-review-checkpoint.sh` as the local checkpoint for invoking native Codex `/review`
- `scripts/run-agent-preflight.sh` for the standard local pre-push confidence checks
- `scripts/run-cli-smoke.sh` for the standard CLI smoke validation path
- `node scripts/codex-pm.mjs issue-state-init <task-path>` for preserving issue-scoped state across longer work

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
findings: no findings
remaining risks: smoke validation was not run locally
```

## Merge Validation

For the standard local readiness pass before push, run:

```bash
./scripts/run-agent-preflight.sh
```

This checks the local review note, review proof, issue-state, build, tests, and local PR closure sync when `gh` can resolve the current PR body.

Set `CLAWPACK_PREFLIGHT_RUN_SMOKE=1` if you also want the CLI smoke path included in the same pass.

## Issue-Scoped Development State

For longer-running issues, initialize a local state document from the matching task twin:

```bash
node scripts/codex-pm.mjs issue-state-init .codex/pm/tasks/<epic>/<task>.md
```

Use it to keep validated facts, open questions, next steps, and key artifacts in one stable place as the work evolves across sessions.

## CLI Smoke Validation

For a standard documented-user-path validation, run:

```bash
./scripts/run-cli-smoke.sh
```

This validates the public `inspect -> export -> import -> verify` path against a temporary OpenClaw-style fixture and requires `verify` to load the persisted imported manifest.

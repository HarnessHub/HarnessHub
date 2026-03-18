# HarnessHub v0.1.0-rc.1 Release Runbook

## Status

Execution runbook for cutting and verifying the first public HarnessHub release candidate.

## Scope

This runbook is intentionally minimal. It covers the repeatable sequence needed to turn the current unreleased repository state into the published `v0.1.0-rc.1` release candidate.

## Preconditions

- `upstream/main` contains the intended RC closeout changes
- the working tree is clean
- GitHub CLI is authenticated with release permissions
- npm authentication is available for the `harnesshub` package
- a real local OpenClaw source exists at `~/.openclaw` or via `HARNESSHUB_OPENCLAW_E2E_SOURCE_DIR`

## Candidate Gate

Run these commands from a clean candidate branch or directly from the final release commit:

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
- the generated validation records reflect the current RC state
- no unexpected dirty worktree drift remains after review of the generated report updates

## Release Notes Inputs

Before publishing, confirm that these files are final:

- `CHANGELOG.md`
- `docs/releases/0004-v0-1-0-rc-1-notes.md`
- `docs/validation/openclaw-e2e-validation.md`
- `docs/validation/fresh-operator-validation.md`

## Publish Sequence

1. Fast-forward local `main` to the reviewed release-closeout commit.
2. Confirm `git status --short` is empty.
3. Create the release tag:

```bash
git tag -a v0.1.0-rc.1 -m "HarnessHub v0.1.0-rc.1"
git push upstream v0.1.0-rc.1
```

4. Publish the npm package as the RC channel:

```bash
npm publish --tag rc
```

5. Create the GitHub release using the final notes document:

```bash
gh release create v0.1.0-rc.1 \
  --repo HarnessHub/HarnessHub \
  --title "HarnessHub v0.1.0-rc.1" \
  --notes-file docs/releases/0004-v0-1-0-rc-1-notes.md \
  --prerelease
```

## Post-Publish Verification

Run all of the following:

```bash
gh release view v0.1.0-rc.1 --repo HarnessHub/HarnessHub
npm view harnesshub versions --json
HARNESSHUB_FRESH_OPERATOR_PACKAGE_SPEC=harnesshub@0.1.0-rc.1 npm run fresh-operator
```

Interpretation:

- the GitHub release exists and is marked prerelease
- npm exposes `0.1.0-rc.1`
- a fresh install path can execute `harness inspect/export/import/verify` successfully

## Final Closeout

After publish succeeds:

- keep `README.md` and `README_zh.md` pinned to the RC install command until `0.1.0` GA exists
- use the recorded validation artifacts as the baseline for the RC announcement
- treat any follow-up fixes as post-RC issues, not silent mutation of the published tag
- use `docs/releases/0005-v0-1-0-ga-go-no-go-gate.md` to decide whether the next step is direct GA or `v0.1.0-rc.2`

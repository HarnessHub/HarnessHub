# HarnessHub v0.1.0 GA Release Runbook

## Status

Execution runbook for promoting the published `v0.1.0-rc.1` baseline to the final `v0.1.0` general-availability release.

## Scope

This runbook covers the minimal repeatable sequence for cutting the final `v0.1.0` release once the GA gate in [0005-v0-1-0-ga-go-no-go-gate.md](./0005-v0-1-0-ga-go-no-go-gate.md) is satisfied.

## Preconditions

- `upstream/main` contains the intended GA closeout changes
- the working tree is clean
- GitHub CLI is authenticated with release permissions
- npm authentication is available for the `harnesshub` package
- the repository version surfaces already read `0.1.0`
- a real local OpenClaw source exists at `~/.openclaw` or via `HARNESSHUB_OPENCLAW_E2E_SOURCE_DIR`

## Candidate Gate

Run these commands from a clean GA candidate branch or directly from the final release commit:

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
- the generated validation records reflect the `0.1.0` GA candidate state
- no unexpected dirty worktree drift remains after review of the generated report updates

## Release Notes Inputs

Before publishing, confirm that these files are final:

- `CHANGELOG.md`
- `docs/releases/0007-v0-1-0-notes.md`
- `docs/validation/openclaw-e2e-validation.md`
- `docs/validation/fresh-operator-validation.md`

## Publish Sequence

1. Fast-forward local `main` to the reviewed GA closeout commit.
2. Confirm `git status --short` is empty.
3. Create the release tag:

```bash
git tag -a v0.1.0 -m "HarnessHub v0.1.0"
git push upstream v0.1.0
```

4. Publish the npm package as the stable release:

```bash
npm publish
```

5. Create the GitHub release using the final notes document:

```bash
gh release create v0.1.0 \
  --repo HarnessHub/HarnessHub \
  --title "HarnessHub v0.1.0" \
  --notes-file docs/releases/0007-v0-1-0-notes.md
```

## Post-Publish Verification

Run all of the following:

```bash
gh release view v0.1.0 --repo HarnessHub/HarnessHub
npm view harnesshub dist-tags --json
HARNESSHUB_FRESH_OPERATOR_PACKAGE_SPEC=harnesshub@0.1.0 npm run fresh-operator
```

Interpretation:

- the GitHub release exists and is not marked prerelease
- npm exposes `0.1.0` as the stable release
- a fresh install path can execute `harness inspect/export/import/verify` successfully against the published GA package

## Final Closeout

After publish succeeds:

- keep `docs/releases/0003-v0-1-0-rc-1-runbook.md` and `docs/releases/0004-v0-1-0-rc-1-notes.md` as historical RC records
- update issue `#97` with the final go/no-go decision and release links
- close issue `#97` once the GA release evidence is recorded

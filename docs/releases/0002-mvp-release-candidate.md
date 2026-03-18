# HarnessHub MVP Release Candidate 1

## Status

Current release-candidate framing for the first HarnessHub MVP cut.

This document packages the current OpenClaw-first MVP into one concrete release candidate instead of leaving release readiness implicit across multiple docs.

## Version Framing

The first HarnessHub MVP release candidate is framed as:

- current unreleased repository/CLI version: `v0.1.0-rc.1`
- intended MVP general-availability target: `v0.1.0`
- release shape: local CLI plus documented image contract
- first production-grade adapter: OpenClaw

This framing keeps the repository's next release-candidate version explicit while preserving `v0.1.0` as the intended MVP final cut.

## What This Release Candidate Includes

- the `harness` CLI with `inspect`, `export`, `import`, and `verify`
- one canonical `.harness` archive format
- explicit manifest, pack-type, placement, rebinding, and readiness semantics
- two export modes: `template` and `instance`
- inspect-to-export workflow guidance
- verify readiness classes with remediation guidance
- a formal MVP image specification
- a committed OpenClaw validation baseline with regression assertions
- repository-local harness guardrails for issue-scoped delivery

## What This Release Candidate Does Not Include

- a second runtime adapter
- parent-image activation or layer composition
- registry or catalog primitives
- cryptographic signing
- hosted UI or SaaS platform behavior

Those remain post-MVP or 1.0 concerns and must not block this release candidate.

## Fresh Operator Acceptance Path

A fresh operator should be able to validate the published release candidate with this path:

```bash
npx harnesshub@0.1.0-rc.1 --version
npm install -g harnesshub@0.1.0-rc.1

harness inspect -p /path/to/openclaw
harness export -p /path/to/openclaw -t template -o my-agent.harness
harness import my-agent.harness -t /tmp/harnesshub-import
harness verify -p /tmp/harnesshub-import
```

For a migration-oriented source, the inspect output should instead recommend:

```bash
harness export -p /path/to/openclaw -t instance -o my-agent.harness
```

If the operator intentionally wants a share-oriented template despite an `instance` recommendation, the explicit override path is:

```bash
harness export -p /path/to/openclaw -t template --allow-pack-type-override -o my-agent.harness
```

## Release Validation Commands

The candidate branch should pass:

```bash
npm run build
npm test
./scripts/run-agent-preflight.sh
./scripts/run-cli-smoke.sh
./scripts/run-openclaw-e2e-validation.sh
```

These commands jointly validate:

- source build correctness
- unit and integration coverage
- repository harness guardrails
- documented CLI path behavior
- real local OpenClaw end-to-end packaging behavior

## Release Notes Summary

This MVP release candidate framing marks the point where HarnessHub is no longer just an OpenClaw packaging experiment.

It now has:

- an explicit product boundary
- an explicit image contract
- explicit pack-type policy
- explicit readiness semantics
- a real validation artifact and regression baseline

That is enough to treat the current repository build as the unreleased release-candidate baseline for the OpenClaw-first MVP.

## References

- `docs/releases/0001-mvp-exit-criteria.md`
- `docs/releases/0003-v0-1-0-rc-1-runbook.md`
- `docs/releases/0004-v0-1-0-rc-1-notes.md`
- `docs/specs/0001-mvp-harness-image-specification.md`
- `docs/validation/fresh-operator-validation.md`
- `docs/validation/openclaw-e2e-validation.md`

# HarnessHub MVP Release Candidate 1

## Status

Current release-candidate framing for the first HarnessHub MVP cut.

This document packages the current OpenClaw-first MVP into one concrete release candidate instead of leaving release readiness implicit across multiple docs.

## Version Framing

The first HarnessHub MVP release candidate is framed as:

- MVP release line: `v0.1.0`
- current release candidate target: `v0.1.0-rc.1`
- release shape: local CLI plus documented image contract
- first production-grade adapter: OpenClaw

This framing keeps the MVP line aligned with the current repository version while making the next publish target an explicit pre-release rather than an immediate final cut.

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

A fresh operator should be able to validate the current release candidate with this path:

```bash
npm install
npm run build

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

This MVP release candidate marks the point where HarnessHub is no longer just an OpenClaw packaging experiment.

It now has:

- an explicit product boundary
- an explicit image contract
- explicit pack-type policy
- explicit readiness semantics
- a real validation artifact and regression baseline

That is enough to treat the current build as a release candidate for the OpenClaw-first MVP.

## References

- `docs/releases/0001-mvp-exit-criteria.md`
- `docs/specs/0001-mvp-harness-image-specification.md`
- `docs/validation/openclaw-e2e-validation.md`

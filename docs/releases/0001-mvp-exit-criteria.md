# HarnessHub MVP Exit Criteria

## Status

Current release gate for calling the OpenClaw-first HarnessHub build an MVP.

This document defines the concrete conditions that must be true before the repository should be presented as an MVP-complete release candidate.

## MVP Intent

HarnessHub MVP proves that one production-grade adapter can package, restore, and verify a reusable harness image with a stable, extensible contract.

For the current MVP, that means:

- OpenClaw is the production-grade adapter
- `.harness` is the canonical portable image format
- the supported lifecycle is `inspect -> export -> import -> verify`
- the image contract is explicit enough to survive future 1.0 evolution

## Exit Gates

All of the following must be true.

### Product Gates

- the repository has one coherent MVP image specification document
- the current lifecycle is documented for a fresh operator
- the repository clearly distinguishes MVP scope from 1.0 scope
- the OpenClaw-first positioning is explicit without implying OpenClaw-only product scope

### Functional Gates

- `inspect` reports structure, sensitivity, and a recommended pack type
- `export` supports both `template` and `instance`
- export policy is explicit when the requested pack type diverges from inspect recommendations
- `import` restores the image and persists import-time manifest metadata
- `verify` evaluates structural validity and readiness class using imported manifest semantics
- the real local OpenClaw validation flow can still produce and verify a `.harness` artifact

### Contract Gates

- the manifest contract is explicitly validated at package boundaries
- pack-type rules are explicit for `template` and `instance`
- placement and rebinding contracts are part of the image model
- readiness classes are explicit and testable
- the committed OpenClaw validation record is covered by in-repo regression assertions

### Repository Harness Gates

- contributors and coding agents can work issue-by-issue with local task twins
- local review proof and preflight are part of the default development path
- repeated workflow failures are expected to be closed through repository harness guardrails

## Required Validation Commands

The MVP exit gate requires these commands to pass on the candidate branch:

```bash
npm run build
npm test
./scripts/run-agent-preflight.sh
./scripts/run-cli-smoke.sh
./scripts/run-openclaw-e2e-validation.sh
```

Expected outcomes:

- build succeeds with no source edits required after the run
- tests pass, including manifest, policy, readiness, and OpenClaw baseline regression coverage
- preflight passes with current review proof and issue-task coherence
- CLI smoke passes for the documented command path
- OpenClaw end-to-end validation refreshes the committed validation record without semantic drift beyond intentional changes

## Acceptable MVP Limitations

The following are acceptable for MVP and must not block the release:

- no second runtime adapter yet
- no parent-image activation or layered composition behavior
- no image registry or catalog primitives
- no cryptographic signing
- no hosted UI or SaaS control plane
- readiness guidance may remain concise as long as non-ready cases are actionable

## MVP Blockers

The following should block an MVP release candidate:

- inability to round-trip a real OpenClaw harness image locally
- manifest, pack-type, placement, rebinding, or readiness semantics drifting without spec and test updates
- inspect/export behavior becoming inconsistent with documented operator flow
- verify regressing to filesystem-only checks that ignore imported manifest semantics
- repository harness regressions that make issue-scoped delivery unreliable

## Release Readiness Decision

HarnessHub should be treated as MVP-complete when:

1. all exit gates above are satisfied
2. all required validation commands pass on the release-candidate branch
3. any remaining open work fits under accepted MVP limitations rather than MVP blockers

At that point, the next step is not more MVP-definition work. The next step is to cut and document the first MVP release candidate.

The current release-candidate framing for that cut is documented in [0002-mvp-release-candidate.md](./0002-mvp-release-candidate.md).

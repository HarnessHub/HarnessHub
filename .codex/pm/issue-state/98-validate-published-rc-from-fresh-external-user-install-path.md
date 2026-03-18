---
type: issue_state
issue: 98
task: .codex/pm/tasks/product-direction/validate-published-rc-from-fresh-external-user-install-path.md
title: Validate published 0.1.0-rc.1 from a fresh external-user install path
status: in_progress
delivery_stage: implementing
---

## Summary

Run a post-release validation pass against the published `harnesshub@0.1.0-rc.1` package from a clean environment that is not relying on the current development checkout.

This is the execution issue for the external-user install path referenced by parent issue #97.

## Validated Facts

- `npx harnesshub@0.1.0-rc.1 --version` succeeds from a fresh temp directory and reports `0.1.0-rc.1`.
- `HARNESSHUB_FRESH_OPERATOR_PACKAGE_SPEC=harnesshub@0.1.0-rc.1 npm run fresh-operator` succeeds and refreshes the committed validation record against the published npm package.
- The fresh-operator validation record now captures both the published package spec and the separate `npx` version check.
- `docs/releases/0002-mvp-release-candidate.md` now describes the fresh-operator acceptance path in terms of the published RC install flow.
- A new automated test covers the fresh-operator script path and protects the npx/package-spec handling.

## Open Questions

- Whether issue #99 should reuse the refreshed validation record directly as one of the GA gate inputs.

## Next Steps

- commit the validation-script, docs, and validation-record updates
- refresh review proof and open the delivery PR for issue #98
- link the validation outcome back to parent issue #97 after the PR is opened

## Artifacts

- `docs/validation/fresh-operator-validation.md`
- `docs/validation/fresh-operator-validation.json`
- `test/fresh-operator-script.test.ts`

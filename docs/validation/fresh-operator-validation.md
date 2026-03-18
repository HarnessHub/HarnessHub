# Fresh Operator Validation

This record validates the documented operator flow through an isolated package install rather than through the repository working tree directly.

- Validated at: `2026-03-18T07:39:35.766Z`
- Package spec: `harnesshub@0.1.0-rc.1`
- Fresh-directory version check: `0.1.0-rc.1`
- Fresh-directory command: `npx harnesshub@0.1.0-rc.1 --version`
- Installed version: `0.1.0-rc.1`
- Source directory: `~/.openclaw`
- Artifact path: `.artifacts/fresh-operator/20260318T073931Z/openclaw-template.harness`
- Artifact sha256: `65593caba240959bcb12411ddd27d77a43629f6360a05d5a07fe948fbf161588`
- Artifact size: `4716834` bytes

## Inspect

- Detected: `true`
- Product: `openclaw`
- Recommended pack type: `instance`
- Risk assessment: `trusted-migration-only`

## Export

- Success: `true`
- Pack type: `template`
- Risk level: `internal-only`

## Import And Verify

- Import success: `true`
- Verify valid: `true`
- Readiness class: `runtime_ready`
- Runtime ready: `true`
- Readiness summary: Imported harness is structurally valid and ready to run without additional manual steps.

## Warnings

- Inspect: Config contains API keys or tokens
- Inspect: Agent auth-profiles.json detected (contains API credentials)
- Inspect: Credentials directory exists
- Import: Rebound workspace paths in openclaw.json to ./.artifacts/fresh-operator/20260318T073931Z/imported; JSON5 formatting/comments were normalized.
- Verify: none

This validation intentionally exercises the packaged CLI path instead of the repository-local `dist/` entrypoint.

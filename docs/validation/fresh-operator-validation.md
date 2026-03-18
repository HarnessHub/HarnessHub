# Fresh Operator Validation

This record validates the documented operator flow through an isolated package install rather than through the repository working tree directly.

- Validated at: `2026-03-18T06:38:00.718Z`
- Package spec: `harnesshub@0.1.0-rc.1`
- npx version check: `0.1.0-rc.1`
- Installed version: `0.1.0-rc.1`
- Source directory: `~/.openclaw`
- Artifact path: `.artifacts/fresh-operator/20260318T063757Z/openclaw-template.harness`
- Artifact sha256: `662a852cbda8a681419ba0bb0a63a46e78ecffb299c413533711431ffcc6e746`
- Artifact size: `4716866` bytes

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
- Import: Rebound workspace paths in openclaw.json to ./.artifacts/fresh-operator/20260318T063757Z/imported; JSON5 formatting/comments were normalized.
- Verify: none

This validation intentionally exercises the packaged CLI path instead of the repository-local `dist/` entrypoint.

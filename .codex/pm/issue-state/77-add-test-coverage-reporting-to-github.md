---
type: issue_state
issue: 77
task: .codex/pm/tasks/repository-harness/add-test-coverage-reporting-to-github.md
title: Add test coverage reporting and surface it clearly on GitHub
status: done
delivery_stage: pr_opened
pr_url: https://github.com/HarnessHub/HarnessHub/pull/78
---

## Summary

HarnessHub currently has a healthy test suite but no coverage instrumentation or GitHub-visible coverage reporting. That makes it easy to know whether tests pass, but hard to see how much of the implementation is exercised and whether coverage is improving or regressing over time.

## Validated Facts

- contributors can run one local command to generate a coverage report
- GitHub surfaces test coverage for the repository or PR in a way that is easy to find without digging through raw logs
- the chosen reporting path is automated enough to catch coverage regressions during normal development
- the implementation does not replace or weaken the existing build, test, smoke, preflight, or OpenClaw validation checks
- the current local coverage run renders a Markdown summary from `coverage/coverage-summary.json` and reports `69.4%` lines, `88.9%` functions, and `66.1%` branches across `src/` and `scripts/`
- the GitHub path is implemented through `.github/workflows/coverage.yml` with a workflow summary, uploaded HTML artifact, and a sticky PR comment when comment permissions are available

## Open Questions

-

## Next Steps

- refresh review proof and run the normal delivery path for issue #77

## Artifacts

- `.github/workflows/coverage.yml`
- `scripts/render-coverage-summary.mjs`
- `coverage/coverage-summary.json`

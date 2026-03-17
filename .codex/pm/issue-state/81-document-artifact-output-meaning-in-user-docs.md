---
type: issue_state
issue: 81
task: ./.codex/pm/tasks/product-direction/document-artifact-output-meaning-in-user-docs.md
title: Document how to interpret harness CLI artifact outputs
status: done
delivery_stage: pr_opened
pr_url: https://github.com/HarnessHub/HarnessHub/pull/82
---

## Summary

The current MVP docs explain the `inspect -> export -> import -> verify` workflow, but they do not clearly explain how to read the JSON outputs or what the produced `.harness` artifact and related reports mean in practice.

## Validated Facts

- A reader can run the MVP commands and understand the meaning of the main output fields without reading the source code
- The docs clearly explain what value the generated artifact proves in a real OpenClaw packaging/migration flow
- The explanation lives in the canonical user-facing doc location rather than an ad hoc note
- README and README_zh are the canonical user-facing locations for this explanation

## Open Questions

-

## Next Steps

- commit the README updates and deliver the issue through the normal review/preflight/PR flow

## Artifacts

- `README.md`
- `README_zh.md`

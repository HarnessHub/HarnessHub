---
type: epic
slug: repository-harness
title: Repository Harness
status: backlog
prd: harness-bootstrap
---

## Outcome

ClawPack gains a practical local harness for disciplined development and validation.

## Scope

- local PM workflow
- hook and preflight guardrails
- CLI smoke validation

## Acceptance Criteria

- harness commands are repository-local
- hooks and preflight are documented and testable
- smoke validation covers the documented CLI path

## Child Issues

- #3 bootstrap ccpm-codex and local guardrails
- #5 harden local harness guardrails for everyday use
- #6 document repository harness governance and daily workflow
- #7 expand CLI integration validation for the pack lifecycle
- #8 reconcile README guarantees with actual CLI behavior

## Notes

This epic intentionally excludes research-only workflows.

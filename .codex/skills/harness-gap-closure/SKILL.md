---
name: harness-gap-closure
description: Use when a repeated workflow mistake or user reminder shows the local harness should have prevented the problem. Add the smallest guardrail and regression coverage.
---

# Harness Gap Closure

Use this skill when a failure should have been prevented by the repository's local harness rather than left to user correction or memory.

## Goal

Turn repeated workflow failures into concrete harness hardening work:

1. identify the harness gap
2. link it to one explicit task or issue
3. implement the smallest reliable guardrail
4. add regression protection
5. update repository guidance where future sessions will see it

## Typical Fixes

- pre-push hook checks
- preflight checks
- repository-local command wrappers
- workflow skill instructions
- fail-fast validation scripts


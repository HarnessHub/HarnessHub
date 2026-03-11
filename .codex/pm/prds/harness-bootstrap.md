---
type: prd
slug: harness-bootstrap
title: ClawPack Harness Bootstrap
status: draft
---

## Summary

Build the repository-local harness needed for issue-scoped agent development, local guardrails, and repeatable CLI validation.

## Problem

ClawPack currently has product code and tests, but it does not yet have a strong repository harness for disciplined issue-task-PR execution.

## Goals

- add local PM and issue-state support
- add pre-push and preflight guardrails
- add a standard CLI smoke validation path

## Non-Goals

- add OpenPrecedent research workflows
- add OpenClaw live-runtime validation harnesses

## Success Criteria

- developers can run a local issue-task-PR workflow inside the repository
- common workflow failures are blocked before push
- the public CLI path is validated through a standard smoke command

## Dependencies

- Node.js 20+


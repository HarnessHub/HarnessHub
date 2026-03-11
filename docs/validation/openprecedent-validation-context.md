# OpenPrecedent Validation Context

## Why This Exists

ClawPack is being used as the first real external project for validating OpenPrecedent runtime decision-lineage reuse and harness transfer.

This repository does not own the master research plan.
The research framing lives in OpenPrecedent:

- [clawpack-real-project-validation-plan.md](/workspace/02-projects/incubation/openprecedent/docs/engineering/clawpack-real-project-validation-plan.md)

This directory only contains the local execution context needed for work inside ClawPack.

## What ClawPack Is Testing

ClawPack is currently serving three validation goals:

1. test whether OpenPrecedent lineage helps real development decisions in a new repository
2. test whether harness practices developed in OpenPrecedent transfer cleanly into a new project
3. sharpen ClawPack's product framing as an agent harness packaging tool rather than a narrow OpenClaw packaging utility

## Local Operating Rule

Inside ClawPack, prefer the narrowest setup that keeps new Codex sessions aligned:

- read the local validation docs first
- use a shared `OPENPRECEDENT_HOME`
- work on one issue at a time
- query lineage only when prior precedent may materially affect direction

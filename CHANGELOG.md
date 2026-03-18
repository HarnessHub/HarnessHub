# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-03-18

### Added

- `harness inspect` — scan an OpenClaw instance structure, detect sensitive data, recommend export type
- `harness export` — export an instance as a `.harness` package (template or instance mode)
- `harness import` — import a `.harness` package into a target directory
- `harness verify` — verify an imported instance is structurally complete
- Template packs automatically exclude credentials, sessions, memory databases, and `.env` files
- Three risk levels: `safe-share`, `internal-only`, `trusted-migration-only`
- JSON and text output formats for all commands
- End-to-end test suite covering the full inspect/export/import/verify pipeline

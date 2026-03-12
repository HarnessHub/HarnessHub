<p align="center">
  <img src="./assets/logo.png" alt="ClawPack" width="200" />
</p>

<h1 align="center">ClawPack</h1>

<p align="center">
  <a href="./README_zh.md">中文文档</a>
</p>

ClawPack is an application-layer packaging and distribution tool for [OpenClaw](https://github.com/openclaw/openclaw) agents.

It solves a simple problem: standardized export, import, and verification of a tuned OpenClaw Agent. It's not a container or a VM — it's an application-level distribution package built on top of those infrastructures.

## Why

An OpenClaw agent's usable state is more than just code or config. It includes:

```
┌─────────────────────────────────────────────────────┐
│              OpenClaw Agent Instance                 │
│                                                     │
│  ┌─────────────┐       ┌────────────────────────┐   │
│  │  Workspace  │       │  Provider Config       │   │
│  │  AGENTS.md  │       │  API keys, model prefs │   │
│  │  SOUL.md    │       └────────────────────────┘   │
│  │  TOOLS.md   │                                    │
│  │  skills/    │       ┌────────────────────────┐   │
│  └─────────────┘       │  Channel Config        │   │
│                        │  Telegram / Slack /     │   │
│  ┌─────────────┐       │  Discord               │   │
│  │  State &    │       └────────────────────────┘   │
│  │  Memory     │                                    │
│  │  sessions   │       ┌────────────────────────┐   │
│  │  vector DBs │       │  Credentials &         │   │
│  └─────────────┘       │  Runtime Info          │   │
│                        └────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

Docker can distribute the runtime environment, but it can't express "which parts are templates, which are state, and which need rebinding." ClawPack fills that gap:

```
                 Docker                          ClawPack
            ┌─────────────┐               ┌──────────────────┐
            │  OS + deps  │               │  template vs     │
            │  runtime    │               │  state vs        │
            │  binaries   │               │  credentials     │
            └─────────────┘               │  ─────────────── │
                                          │  risk detection  │
           Distributes the                │  selective export│
           "how to run"                   └──────────────────┘

                                          Distributes the
                                          "what the agent is"
```

ClawPack understands the current OpenClaw layout, including `agents/*`, `workspace-*`, and config-defined workspaces outside the state dir. During import, it rebinds workspace paths in `openclaw.json` to the target directory so multi-agent packs remain runnable after migration.

## Install

```bash
npm install -g clawpack
```

Requires Node.js >= 20.

## Quick Start

The four commands form a linear workflow:

```
  Machine A                                          Machine B
 ┌────────────────────────────────────┐    ┌─────────────────────────────┐
 │                                    │    │                             │
 │  ① inspect ──▶ ② export           │    │  ③ import ──▶ ④ verify     │
 │     scan          pack to          │    │     unpack        check    │
 │     & report      .clawpack  ──────┼───▶│     & restore     struct  │
 │                                    │    │                             │
 └────────────────────────────────────┘    └─────────────────────────────┘
```

```bash
# 1. Inspect an OpenClaw instance
clawpack inspect

# 2. Export as a template pack (safe to share)
clawpack export -t template -o my-agent.clawpack

# 3. Import on another machine
clawpack import my-agent.clawpack -t ~/.openclaw

# 4. Verify the import
clawpack verify
```

## Commands

### `clawpack inspect`

Scan an OpenClaw instance, report its structure, sensitive data, and recommended export type.

```
 ~/.openclaw/
 ├── config/
 ├── workspace/         clawpack inspect
 ├── state/          ─────────────────────▶   Report:
 ├── .env                                     - structure overview
 └── ...                                      - sensitive data found
                                              - recommended pack type
```

```bash
clawpack inspect                  # auto-detect ~/.openclaw
clawpack inspect -p /path/to/dir  # custom path
clawpack inspect -f json          # JSON output
```

### `clawpack export`

Export an instance as a `.clawpack` package.

```
 ~/.openclaw/                                my-agent.clawpack
 ├── config/          clawpack export        (gzipped tar)
 ├── workspace/    ─────────────────────▶    ┌──────────────┐
 ├── state/           -t template            │ manifest.json│
 ├── .env             -o my-agent.clawpack   │ config/      │
 └── ...                                     │ workspace/   │
                       ▲                     │ reports/     │
                       │                     └──────────────┘
                 secrets excluded
                 (template mode)
```

```bash
clawpack export -t template       # template pack (excludes secrets)
clawpack export -t instance       # instance pack (full migration)
clawpack export -o out.clawpack   # custom output path
clawpack export -p /path/to/dir   # custom source path
```

### `clawpack import`

Import a `.clawpack` package into a target environment.

```
 my-agent.clawpack                          ~/.openclaw/
 ┌──────────────┐    clawpack import        ├── config/
 │ manifest.json│  ─────────────────────▶   ├── workspace/
 │ config/      │    -t ~/.openclaw         ├── state/
 │ workspace/   │                           └── ...
 │ state/       │
 └──────────────┘
```

```bash
clawpack import my-agent.clawpack              # restore to ~/.openclaw
clawpack import my-agent.clawpack -t ./target  # custom target
```

### `clawpack verify`

Verify an imported instance is structurally complete and basically readable. When a persisted import manifest is present, `verify` also checks manifest-related expectations.

```
 ~/.openclaw/
 ├── config/  ✓        clawpack verify
 ├── workspace/  ✓   ─────────────────▶   All checks passed  ✓
 ├── AGENTS.md  ✓                          - directories exist
 └── state/  ✓                             - workspace intact
                                           - manifest checks (if imported manifest is available)
```

```bash
clawpack verify                  # verify ~/.openclaw
clawpack verify -p /path/to/dir  # custom path
```

## Package Types

```
                          .clawpack
                        ┌───────────┐
                        │           │
                ┌───────┴───┐ ┌────┴──────┐
                │ template  │ │ instance  │
                └─────┬─────┘ └─────┬─────┘
                      │             │
          ┌───────────┴──┐  ┌──────┴───────────────┐
          │ Workspace    │  │ Workspace             │
          │ Safe config  │  │ Full config           │
          │              │  │ State & sessions      │
          │ ✗ secrets    │  │ Credentials & .env    │
          │ ✗ sessions   │  │                       │
          │ ✗ .env       │  │                       │
          └──────────────┘  └──────────────────────┘
                │                     │
          safe-share           trusted-migration-only
         (share publicly)     (trusted environments only)
```

| Type | Use Case | Includes | Risk Level |
|------|----------|----------|------------|
| **template** | Share & reuse | Workspace, non-sensitive config | Share-oriented; manifest risk is still derived from detected source sensitivity |
| **instance** | Full migration | Config, workspace, state, credentials | Usually `trusted-migration-only` when credentials or state are present |

Template packs automatically exclude credentials, sessions, memory databases, and `.env` files, but the manifest still records what sensitive indicators were detected in the source instance.

## Package Format

A `.clawpack` file is a gzipped tar archive containing:

```
my-agent.clawpack (gzipped tar)
│
├── manifest.json ─── Pack metadata
│                     ├── schema version
│                     ├── pack type (template / instance)
│                     └── risk level
│
├── config/ ───────── Configuration files
│
├── workspace/ ────── Agent workspace
│                     ├── AGENTS.md
│                     ├── SOUL.md
│                     └── skills/
│
├── workspaces/ ───── Additional per-agent workspaces
│                     └── <agentId>/
│
├── state/ ────────── Session & credential data
│                     (instance packs only)
│
└── reports/ ──────── Export report
```

## Risk Levels

```
  safe-share              internal-only           trusted-migration-only
 ┌──────────────┐       ┌──────────────┐        ┌──────────────┐
 │  No secrets  │       │  Non-critical │        │  Credentials │
 │  No state    │       │  config only  │        │  State data  │
 │              │       │              │        │  Sessions    │
 │  Safe to     │       │  Team-only   │        │  Trusted env │
 │  distribute  │       │  sharing     │        │  only        │
 └──────────────┘       └──────────────┘        └──────────────┘
    Low risk ◀──────────────────────────────────────▶ High risk
```

| Level | Description |
|-------|-------------|
| `safe-share` | No sensitive data, safe to distribute |
| `internal-only` | May contain non-critical config, share within team |
| `trusted-migration-only` | Contains credentials/state, trusted environments only |

Risk level is assessed from the exported manifest metadata and detected source sensitivity, not only from the chosen pack type.

## Output Formats

All commands support `-f text` (default, human-readable) and `-f json` (machine-readable).

```
 clawpack inspect -f text          clawpack inspect -f json
 ┌─────────────────────┐           ┌──────────────────────┐
 │  === Scan Report === │           │ {                    │
 │  Path: ~/.openclaw   │           │   "path": "~/.oc..", │
 │  Files: 42           │           │   "files": 42,       │
 │  Risk: safe-share    │           │   "risk": "safe-sh.."│
 └─────────────────────┘           │ }                    │
    human-readable                 └──────────────────────┘
                                      machine-readable
```

```bash
clawpack inspect -f json | jq '.riskAssessment'
```

## Development

```bash
git clone https://github.com/Mrxuexi/clawpack.git
cd clawpack
npm install
npm run build
npm test
```

### Project Structure

```
src/
├── cli.ts ─────────── Entry point (commander, 4 commands)
├── commands/
│   ├── inspect.ts ─── Scan & report
│   ├── export.ts ──── Export to .clawpack
│   ├── import.ts ──── Import from .clawpack
│   └── verify.ts ──── Structural verification
├── core/
│   ├── scanner.ts ─── Instance detection, sensitive data scan
│   ├── packer.ts ──── Pack/unpack logic, exclusion rules
│   ├── verifier.ts ── Integrity checks
│   └── types.ts ───── Shared types & constants
└── utils/
    └── output.ts ──── Output formatting (text / json)
```

## License

MIT

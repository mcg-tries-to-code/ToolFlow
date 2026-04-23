# Install

## Local development install

Requirements:
- Node.js 25+
- npm 11+

Install and build:

```sh
cd toolflow
npm install
npm run build
```

Verify the local runtime:

```sh
node packages/runtime/dist/main.js doctor
node packages/runtime/dist/main.js validate packages/examples/workflows/safe-profile-mvp.json
```

Run the example workflow:

```sh
node packages/runtime/dist/main.js run packages/examples/workflows/safe-profile-mvp.json
```

Validate the bounded health monitor workflow:

```sh
node packages/runtime/dist/main.js validate packages/examples/workflows/health-downtrend-monitor.json
```

Validate the bounded workspace governance workflow:

```sh
node packages/runtime/dist/main.js validate packages/examples/workflows/workspace-governance-monthly.json
```

Inspect persisted artifacts:

```sh
node packages/runtime/dist/main.js status <run_id>
node packages/runtime/dist/main.js inspect <run_id>
```

Recover an interrupted run:

```sh
node packages/runtime/dist/main.js recover <run_id>
```

Canonical local ledger root:

```text
toolflow/data/ledger/
```

## Elevated local development profile

Elevated execution is opt-in and disabled by default.

Enable it only for local development:

```sh
TOOLFLOW_ENABLE_ELEVATED=1 \
TOOLFLOW_ELEVATED_ALLOW=node,git \
node packages/runtime/dist/main.js run ./workflow.json
```

Approval flow:

```sh
node packages/runtime/dist/main.js approve <run_id> <step_id> [approved_by]
node packages/runtime/dist/main.js resume <run_id>
```

Development keys:
- ordinary: `toolflow/data/ledger/keys/ordinary-dev-key.json`
- elevated: `toolflow/data/ledger/keys/elevated-dev-key.json`

## Cron-friendly ToolFlow wrappers

Example wrapper locations in a local deployment might look like:

```text
./scripts/run_health_downtrend_monitor_toolflow.sh
./scripts/run_workspace_governance_monthly_toolflow.sh
```

Recommended cron replacements when ready:

```cron
0 18 * * 1,4,6 /path/to/project/scripts/run_health_downtrend_monitor_toolflow.sh
0 0 28 * * /path/to/project/scripts/run_workspace_governance_monthly_toolflow.sh
```

## Package layout

- `packages/shared` - contracts and hashes
- `packages/elevated` - elevated bridge/cell package
- `packages/runtime` - CLI and control plane
- `packages/plugin` - thin local runtime-backed plugin surface

## Current non-goals

This local build still does not provide:
- hardened multi-process IPC transport
- operator-grade key custody and rotation
- outbound messaging lane
- generic tool invocation ABI
- multi-host transport
- schema migration framework

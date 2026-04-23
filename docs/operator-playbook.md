# Operator Playbook

## Normal local flow

1. Build the monorepo.

```sh
npm install
npm run build
```

2. Validate or dry-run a workflow before execution.

```sh
node packages/runtime/dist/main.js validate packages/examples/workflows/safe-profile-mvp.json
node packages/runtime/dist/main.js dry-run packages/examples/workflows/safe-profile-mvp.json
```

3. Execute the workflow.

```sh
node packages/runtime/dist/main.js run packages/examples/workflows/safe-profile-mvp.json
```

For long runs, enable periodic progress updates after 5 minutes.

```sh
TOOLFLOW_PROGRESS_ENABLED=1 \
TOOLFLOW_PROGRESS_AFTER_SECONDS=300 \
TOOLFLOW_PROGRESS_INTERVAL_SECONDS=300 \
node packages/runtime/dist/main.js run packages/examples/workflows/safe-profile-mvp.json
```

By default progress events go to stderr as JSON lines prefixed with `[toolflow-progress]`.
To fan them out to OpenClaw as live user-visible updates, use the command sink:

```sh
TOOLFLOW_PROGRESS_ENABLED=1 \
TOOLFLOW_PROGRESS_SINK=command \
TOOLFLOW_PROGRESS_COMMAND='openclaw system event --text "$TOOLFLOW_PROGRESS_TEXT" --mode now' \
node packages/runtime/dist/main.js run packages/examples/workflows/safe-profile-mvp.json
```

The hook receives these environment variables: `TOOLFLOW_PROGRESS_TEXT`, `TOOLFLOW_PROGRESS_JSON`, `TOOLFLOW_PROGRESS_RUN_ID`, `TOOLFLOW_PROGRESS_STATE`, and `TOOLFLOW_PROGRESS_STEP_ID`.

4. Inspect the canonical ledger output.

```sh
node packages/runtime/dist/main.js status <run_id>
node packages/runtime/dist/main.js inspect <run_id>
```

5. If interrupted, reconcile before resuming.

```sh
node packages/runtime/dist/main.js recover <run_id>
```

## Elevated local-development flow

1. Enable the elevated lane explicitly.

```sh
TOOLFLOW_ENABLE_ELEVATED=1 \
TOOLFLOW_ELEVATED_ALLOW=node,git \
node packages/runtime/dist/main.js run ./workflow.json
```

2. When the run pauses in `awaiting_approval`, approve the exact step.

```sh
node packages/runtime/dist/main.js approve <run_id> <step_id> [approved_by]
```

3. Resume execution.

```sh
node packages/runtime/dist/main.js resume <run_id>
```

## Canonical state

Treat `toolflow/data/ledger/` as canonical runtime state.
Within each run directory:
- `workflow.json` is the submitted source
- `compiled-graph.json` is the derived execution graph
- `proof-bundle.json` is the preflight classifier output
- `policy-artifact.json` is the binding policy truth
- `manifest.json` is the current run state
- `events.jsonl` is the append-only event log
- `approvals/` holds exact-payload approval bindings
- `grants/` and `receipts/` hold authoritative execution records
- `artifacts/` holds step outputs

## Recovery posture

Recovery is a first-class operational path in the local profile.
The runtime supports:
- manifest, grant, and receipt reconciliation
- requeue of replayable interrupted steps
- quarantine of `review_before_replay` steps when a consumed grant has no terminal receipt
- explicit operator review before resume of quarantined work

If a run stops mid-flight:
- run `recover`
- inspect `manifest.json`
- inspect `events.jsonl`
- inspect `grants/`, `receipts/`, and `approvals/`
- do not resume quarantined runs without review

## Key management

Local development keys:

```text
toolflow/data/ledger/keys/ordinary-dev-key.json
toolflow/data/ledger/keys/elevated-dev-key.json
```

This remains the correct key posture for the current local profile.
If the deployment target expands beyond the local profile, add rotation guidance, stronger custody, and documented operator ceremony for elevated approvals before widening scope.

## Incidents that should block further expansion

Do not proceed to broader distribution if any of the following occur:
- grants can be replayed after consumption
- policy hash mismatches are not rejected
- payload hash mismatches are not rejected
- approval for an old payload can authorize a changed payload
- receipts can be forged with stale or wrong keys
- recovery silently replays `review_before_replay` steps
- ledger state becomes ambiguous after interruption

That would be an excellent moment to stop congratulating ourselves.

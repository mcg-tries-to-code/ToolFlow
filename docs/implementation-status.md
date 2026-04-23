# ToolFlow v5 Implementation Status

Date: 2026-04-21 EDT local workspace session.

## Built

- Shared contracts in `packages/shared`: stable ids, canonical JSON hashing, schema/version constants, workflow/graph/proof/policy/grant/receipt/run types, and exact-payload approval bindings.
- Runtime spine in `packages/runtime`: JSON workflow compiler, capability classifier, proof bundle builder, policy artifact generator, file-backed ledger, grant minting, receipt persistence, run manifest state, scheduler, dispatcher, recovery reconciliation, and typed bridge/cell execution.
- Runtime control-plane extensions for native-style orchestration: file-backed TaskFlow controller records in `packages/runtime/src/control-plane/taskflow-controller.ts` and live TaskFlow mirror records in `packages/runtime/src/control-plane/taskflow-mirror.ts`.
- Separate elevated package in `packages/elevated` with its own development signing domain, local-only transport guard, and typed elevated bridge/cell exports.
- Thin packaging/plugin surface in `packages/plugin` for local runtime-backed submit/dry-run/status/inspect wiring.
- CLI commands: `validate`, `dry-run`, `run`, `resume`, `approve`, `recover`, `status`, `inspect`, and `doctor`.
- Ordinary Safe Profile actions: `read_file`, `list_files`, `research_note`, and `session_note`.
- Narrow elevated local-development actions: `exec_command` and `apply_patch`, both gated by exact-payload approval.
- Tests under `toolflow/tests/mvp.test.mjs`, including elevated approval-and-resume plus recovery cases.
- Example workflow at `packages/examples/workflows/safe-profile-mvp.json`.

## What Works

- `npm test` builds the shared, elevated, runtime, and plugin packages and passes all integration tests.
- `validate` compiles workflows and reports stable graph hashes.
- `dry-run` emits a proof bundle and compiled policy artifact, including `requires_approval` when elevated steps are present.
- `run` executes ordinary steps immediately and pauses elevated steps in `awaiting_approval` until an exact step approval exists.
- `approve` writes a payload-bound approval artifact for a specific elevated step.
- `resume` continues the run after approval and preserves the signed single-use grant model.
- `recover` reconciles interrupted runs by requeuing replayable interrupted steps and quarantining `review_before_replay` steps that lost their terminal receipt.
- `status` and `inspect` read persisted ledger state.
- TaskFlow mirror records are now emitted for run lifecycle changes under `toolflow/data/taskflow-mirror/` and expose mapped owner semantics such as `running`, `waiting`, `blocked`, and `done`.
- Controller flows can now be created and reconciled locally, linking ToolFlow runs to a higher-level orchestration record under `toolflow/data/taskflow-mirror/controller/`.
- The canonical local execution ledger remains `toolflow/data/ledger/`, with TaskFlow-derived mirrors under `toolflow/data/taskflow-mirror/`.

## Elevated Lane Notes

Current elevated lane posture is intentionally narrow:
- disabled by default
- enabled only with `TOOLFLOW_ENABLE_ELEVATED=1`
- `exec_command` further constrained by `TOOLFLOW_ELEVATED_ALLOW=<comma-separated binaries>`
- exact-payload, per-step approval required before grant minting
- local-only development posture, not a broad generic invocation surface
- separate elevated development key at `toolflow/data/ledger/keys/elevated-dev-key.json`

The elevated logic now exists as a separate package, although the current monorepo wiring still uses local build-path coupling rather than a finished published-package integration contract.

## Scope Boundaries

The current build is intentionally optimized for a **local, typed, approval-bound ToolFlow profile**.
Within that scope, the implementation is now complete enough to treat the architecture, recovery foundation, plugin/runtime surface, and packaging path as green.

Deliberate boundaries, not defects:
- local-process and local-host posture rather than multi-host transport
- development-key custody rather than hardened operator secret storage
- JSON workflow language rather than broader authoring formats
- no outbound messaging lane
- no generic invoke-anything escape hatch

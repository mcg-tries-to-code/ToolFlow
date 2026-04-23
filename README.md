# ToolFlow

ToolFlow is a bounded workflow runtime for long-running agent work.

It exists to solve an irritatingly common failure mode in agent systems: the agent can do impressive individual steps, but multi-step jobs become opaque, fragile, hard to recover, and difficult to govern once they run longer than a single conversational turn.

ToolFlow addresses that gap with a typed workflow model, a durable ledger, explicit approval boundaries, recovery semantics, and now live progress updates for long-running work.

## Why ToolFlow exists

ToolFlow was built to make long-running agent execution behave more like a disciplined job system and less like hopeful improvisation.

It is designed to provide:
- durable run identity
- explicit step graphs
- exact-payload approval for elevated work
- signed grants and authoritative receipts
- inspectable manifests and event history
- recovery after interruption
- progress visibility during long builds or bounded automation runs

In practical terms, it is meant for the category of work where a normal agent turn is too short-lived, too implicit, or too easy to lose.

## Problems ToolFlow is meant to solve

1. **Long-running work disappears into silence**
   - Users should not have to wonder whether a build is still running, blocked, or finished.
2. **Conversations are poor durable job records**
   - Chat alone is a miserable source of truth for multi-step execution.
3. **Elevated actions need bounded approvals**
   - Approval should bind to the exact payload, not vague operator intent.
4. **Interrupted runs need recovery, not wishful reruns**
   - Recovery and quarantine semantics should be first-class.
5. **Derived status should not impersonate canonical truth**
   - The ledger should remain authoritative, with mirrors and summaries clearly secondary.

## Current status

This repository currently implements a local Safe Profile with:
- typed workflow compilation
- a durable file-backed ledger
- ordinary typed bridge actions
- a separate elevated package and signing domain
- exact-payload approval bindings
- recovery and reconciliation
- TaskFlow mirror records
- a file-backed controller surface for higher-level orchestration
- live progress updates for long-running runs

## Implemented actions

Ordinary typed bridge actions:
- `read_file`
- `list_files`
- `research_note`
- `session_note`

Elevated development actions:
- `exec_command`
- `apply_patch`

## Elevated posture

- disabled by default
- exact-payload approval required per elevated step
- local-development posture only
- separate elevated development signing key
- `exec_command` additionally requires `TOOLFLOW_ELEVATED_ALLOW=<comma-separated binaries>`

## Deployment posture

- suitable today for single-operator and trusted local use
- not yet intended as a turnkey public multi-user runtime
- shared-user or public-facing deployments require additional ownership and isolation controls in the host platform

## Long-run progress behavior

- direct CLI runs default to no live chat updates unless progress env vars are enabled
- plugin-backed ToolFlow runs default to structured `stderr` progress events after 5 minutes, then every 5 minutes thereafter
- live user-facing progress updates are available, but should be enabled explicitly by the operator through `ToolflowPluginConfig.progressUpdates`
- override or disable through `ToolflowPluginConfig.progressUpdates`

## Quick commands

```sh
npm test
node packages/runtime/dist/main.js doctor
node packages/runtime/dist/main.js dry-run packages/examples/workflows/safe-profile-mvp.json
node packages/runtime/dist/main.js run packages/examples/workflows/safe-profile-mvp.json
node packages/runtime/dist/main.js approve <run_id> <step_id> [approved_by]
node packages/runtime/dist/main.js resume <run_id>
node packages/runtime/dist/main.js recover <run_id>
```

To enable the elevated lane in local development:

```sh
TOOLFLOW_ENABLE_ELEVATED=1 TOOLFLOW_ELEVATED_ALLOW=node,git node packages/runtime/dist/main.js run ./workflow.json
```

## Package layout

- `packages/shared` - contracts and hashing
- `packages/elevated` - elevated bridge/cell package
- `packages/runtime` - compiler, ledger, scheduler, CLI
- `packages/plugin` - thin local runtime-backed plugin surface
- `packages/openclaw-skill` - OpenClaw-facing operator wrapper skill for ToolFlow
- `packages/authoring-skill` - workflow authoring layer for ToolFlow

## Inspiration and credit

ToolFlow was materially inspired by the Hermes agent work from **Nous Research** and the broader idea that an agent should be able to persist, recover, and grow beyond a single turn. ToolFlow is not a copy of Hermes. It is a separate implementation shaped around bounded workflows, durable control-plane state, approval semantics, and explicit operator governance.

See `docs/toolflow-overview.md`, `docs/openclaw-integration.md`, `docs/security-assessment-2026-04-23.md`, and `docs/authorship-and-attribution.md` for the publication-facing overview, OpenClaw integration model, security judgment, and attribution notes.

# Native OpenClaw TaskFlow + ToolFlow Integration Architecture

Date: 2026-04-21
Status: proposed architecture with local prototype skeleton

## Executive summary

The correct design is **not** to make ToolFlow impersonate TaskFlow, and it is **not** to ask native OpenClaw TaskFlow to become a self-directing executive.

The correct split is:

- **Native OpenClaw TaskFlow** owns the durable job, waiting semantics, owner session, and terminal state.
- **ToolFlow** owns bounded execution runs, typed steps, receipts, proofs, approvals, and recovery.
- A **TaskFlow controller** sits above both and drives continuation until the job reaches a true terminal condition.

In short:

- TaskFlow = ownership and orchestration
- ToolFlow = execution and receipts
- Controller = judgment, state transitions, and re-attachment logic

## The problem to solve

### What native TaskFlow already does well

Native TaskFlow already has the correct substrate for durable work:

- flow identity
- owner session binding
- current step and persisted state
- waiting state via `waitJson`
- child task linkage
- revision-checked mutations
- finish, fail, cancel, resume

### What it does not do by itself

It does not invent the business logic that decides:

- what the next step should be
- when to wait
- when to resume
- when a child result is sufficient to advance
- when the whole job is truly done versus merely paused

If nothing owns those decisions, a TaskFlow can be persisted yet still functionally drift.

### Current ToolFlow reality

ToolFlow now has a good local execution spine:

- workflow compilation
- classifier and policy artifact generation
- explicit run manifests
- grant issuance
- receipts
- approval pause
- recovery
- typed ordinary bridges
- optional elevated lane

But the current ToolFlow runtime still lacks a live TaskFlow bridge. The `taskflow-mirror` remains stubbed as disabled.

## Design goals

1. **Durable owner semantics**
   A substantial job must remain explicitly alive until terminal.

2. **Strict separation of concerns**
   TaskFlow owns job state, ToolFlow owns step execution proof.

3. **Explicit non-terminal states**
   No vague middle.

4. **Wake-driven continuation**
   Resume on completion, approval, time, or external event.

5. **Minimal canonical state**
   Persist only what is needed to continue safely.

6. **Governed messaging**
   User updates only on completion, blocker, approval need, or material change.

## Canonical components

### 1. Managed TaskFlow controller

A controller module/plugin owns the orchestration logic for a managed TaskFlow.

Responsibilities:

- create managed flows
- persist controller state in `stateJson`
- map child execution into flow state
- set waiting state with precise `waitJson`
- resume the flow on wake conditions
- decide terminal state

This controller is where the "keep going until done or impasse" contract actually lives.

### 2. ToolFlow execution adapter

The controller delegates bounded work to ToolFlow when the work benefits from:

- typed execution contracts
- receipts
- recovery
- approval-gated elevated steps
- classifier and policy artifacts

The adapter does not own the job. It owns only a linked execution run.

### 3. Wake broker

The wake broker is the re-attachment surface.

Supported wake reasons:

- child ToolFlow run completion
- child ToolFlow approval required
- explicit external reply/event
- time-based wake
- manual operator resume
- heartbeat or cron inspection fallback

### 4. Status mapper

This maps ToolFlow run state into TaskFlow controller semantics.

| ToolFlow state | TaskFlow/controller meaning |
| --- | --- |
| `ready` | still runnable, stay `running` |
| `running` | `running` |
| `awaiting_approval` | `waiting` with approval-specific `waitJson` |
| `succeeded` | execution complete, controller must evaluate next step |
| `failed` | `blocked` or `impasse` pending controller judgment |
| `quarantined` | `blocked` with explicit review required |
| `cancelled` | `cancelled` or controller-managed recovery decision |
| `rejected` | `blocked` or `impasse` |

## Controller state model

Persist in TaskFlow `stateJson`.

```json
{
  "version": 1,
  "goal": "deliver X",
  "doneDefinition": "observable terminal success criteria",
  "blockerDefinition": "what counts as a real impasse",
  "planVersion": 1,
  "currentObjective": "current human-level objective",
  "linkedRuns": [
    {
      "kind": "toolflow",
      "runId": "run_xxx",
      "purpose": "bounded execution for step Y",
      "status": "running"
    }
  ],
  "pendingDecisions": [],
  "artifacts": [],
  "lastMaterialProgressAt": "2026-04-21T12:00:00Z"
}
```

## Wait model

Persist in TaskFlow `waitJson`.

Examples:

### Awaiting approval

```json
{
  "kind": "approval",
  "system": "toolflow",
  "runId": "run_xxx",
  "stepId": "apply_patch_prod",
  "reason": "exact-payload elevated approval required"
}
```

### Awaiting time

```json
{
  "kind": "time",
  "wakeAt": "2026-04-21T16:00:00Z",
  "reason": "recheck child completion"
}
```

### Awaiting external reply

```json
{
  "kind": "reply",
  "channel": "telegram",
  "threadKey": "telegram:<operator-thread>",
  "reason": "waiting for human decision on architecture tradeoff"
}
```

## State machine

### Non-terminal

- `running`
- `waiting`
- `blocked`

### Terminal

- `done`
- `failed`
- `cancelled`

### Interpretation

- `running` means controller has a next step or active child work.
- `waiting` means progress is impossible until a defined wake condition occurs.
- `blocked` means something is wrong enough that intervention or explicit review is required.
- `done` means the done definition is satisfied.
- `failed` means the blocker definition was met and the objective cannot be completed under current conditions.

## Lifecycle

### Phase 1: create

1. Create managed TaskFlow.
2. Persist the minimal controller state.
3. Set `currentStep` to the first orchestration step.

### Phase 2: delegate execution

1. Controller compiles or selects a ToolFlow workflow.
2. Controller launches ToolFlow run.
3. Controller records the linked run id in `stateJson`.
4. Controller keeps TaskFlow in `running` or `waiting` depending on whether synchronous follow-through is possible.

### Phase 3: wait

If ToolFlow reaches a non-terminal pause, controller sets waiting:

- approval required
- time sleep
- external reply
- operator review

### Phase 4: resume

Wake broker triggers controller resume.
The controller:

- inspects linked runs
- reconciles state
- decides next action
- launches another ToolFlow run, asks for approval, requests input, or closes terminally

### Phase 5: finish

Only the controller decides terminality.
ToolFlow success by itself does **not** imply TaskFlow done. It merely means one execution segment succeeded.

## Required invariants

1. Every substantial job has exactly one owner TaskFlow.
2. Every ToolFlow run linked to a job must be referenced in TaskFlow `stateJson`.
3. A TaskFlow cannot remain in `running` without either:
   - an active next step, or
   - linked active child work.
4. A TaskFlow cannot remain in `waiting` without structured `waitJson`.
5. A TaskFlow cannot be marked `done` unless the controller validates the done definition.
6. ToolFlow receipts are canonical for step execution, but not for job completion.

## Event and wake strategy

Preferred order:

1. **Direct completion event wake**
   ToolFlow child completion triggers TaskFlow resume.

2. **Approval event wake**
   ToolFlow approval-required transition triggers TaskFlow wait/update.

3. **Time wake**
   TaskFlow `waitJson.kind=time` reattaches at `wakeAt`.

4. **External event wake**
   Human reply or external system callback resumes the flow.

5. **Fallback sweep**
   Heartbeat or cron inspects stuck active flows and due waits.

The fallback sweep should exist, but it should not be the primary orchestration mechanism.

## Canonical source-of-truth boundaries

### Canonical

- TaskFlow record for job ownership state
- ToolFlow ledger for bounded execution receipts and run states

### Derived

- dashboards
- summaries
- due queues
- status mirrors
- heartbeat inspection caches

### Scratch

- temporary compiled workflow sources
- transient execution notes

## Failure handling

### ToolFlow child fails

Controller must inspect and classify:

- retry immediately
- repair and rerun
- wait for approval or input
- escalate to blocked/failed

### ToolFlow child quarantined

Controller moves TaskFlow to `blocked` with explicit review requirement.

### Lost wake

Fallback sweep finds active TaskFlows whose linked ToolFlow runs have already changed state.

### Revision conflict

Controller re-reads TaskFlow state and retries mutation using latest revision.

## Security and governance posture

- TaskFlow should not silently broaden authority.
- ToolFlow elevated steps remain exact-payload approval bound.
- The controller may decide to request approval, but it must not forge or bypass approval.
- Derived mirrors must never impersonate canonical TaskFlow or ToolFlow records.

## Implementation plan

### Stage A: local prototype

Build a local controller prototype in the workspace:

- controller contracts
- status mapping logic
- wake reason model
- example lifecycle

### Stage B: ToolFlow bridge activation

Replace the current `taskflow-mirror` stub with an adapter contract that can:

- publish child run lifecycle events
- hydrate linked status summaries
- provide exact run state lookup

### Stage C: native TaskFlow controller plugin

Build the managed-flow controller in OpenClaw plugin/runtime space:

- bind session
- create managed flow
- launch ToolFlow child work
- set waiting and resume on wake

### Stage D: first real production flow

Cut over one real multi-step background workflow and verify:

- no silent decay
- explicit waits
- terminal closure
- minimal user noise

## Recommended first production candidate

A workflow that already benefits from periodic checks, bounded execution, and user-minimal updates is ideal. The current health and governance flows are plausible candidates, but the best first candidate is whichever has:

- clear done criteria
- occasional waiting
- real external dependencies
- low blast radius

## Blunt conclusion

Native OpenClaw TaskFlow is not hopeless. It is merely incomplete without a controller.

ToolFlow should not replace it. ToolFlow should execute beneath it.

The proper architecture is a **managed TaskFlow controller with ToolFlow child execution and explicit wake-driven continuation**.

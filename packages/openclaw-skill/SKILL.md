# ToolFlow OpenClaw Operator

Use this skill when work should be framed as a ToolFlow job rather than handled as an improvised one-off turn.

## Purpose

This skill is the OpenClaw-facing wrapper for ToolFlow.

It exists to pair:
- the **ToolFlow plugin/runtime surface**, which can submit, inspect, reconcile, and cancel runs
- the **ToolFlow authoring layer**, which helps write bounded workflows intentionally

## When to use it

Use ToolFlow through this skill when the job benefits from one or more of the following:
- a durable run id
- a typed step graph
- dry-run classification before execution
- explicit approvals for elevated steps
- receipts, manifests, and recovery
- user-visible progress updates for longer-running work

## Basic operator loop

1. Describe the workflow in a narrow, typed way.
2. Dry-run it first when feasible.
3. Run it through the ToolFlow plugin/runtime surface.
4. If a step requires approval, approve the exact step and resume.
5. If interrupted, recover before replay.

## Boundaries

- Prefer typed safe lanes over elevated lanes.
- Treat the ToolFlow ledger as canonical truth.
- Do not widen scope just because a workflow language exists.
- Keep long-running work observable rather than silent.

## Packaging note

This skill is intended to be distributed alongside the ToolFlow plugin/runtime integration rather than pretending the skill alone is the whole system.

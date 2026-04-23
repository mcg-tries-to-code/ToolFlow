# Native TaskFlow Controller Prototype

This prototype is a local skeleton for the architecture in `toolflow/docs/native-taskflow-integration-architecture.md`.

It is deliberately not wired into production OpenClaw runtime code yet.

## Files

- `controller-contract.ts` — controller-facing contracts for TaskFlow, ToolFlow, wake reasons, and linked runs
- `controller-loop.ts` — reference orchestration loop showing how TaskFlow ownership can drive ToolFlow child execution and wake-based continuation

## Purpose

The aim is to make the intended control plane explicit before touching native runtime/plugin code.

That keeps the first integration step small, reviewable, and less likely to become an elegant disaster.

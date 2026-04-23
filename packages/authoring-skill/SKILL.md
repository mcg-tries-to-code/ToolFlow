# ToolFlow Authoring

Use this authoring layer when a workflow should be described declaratively, classified before execution, and routed through ToolFlow rather than improvised one-off shell or tool calls.

## When to use ToolFlow

Use ToolFlow when the job benefits from:
- repeatable step graphs
- explicit dependencies
- dry-run classification before execution
- exact-payload approval binding for elevated steps
- ledgered receipts and recovery

Do not bother when the task is a trivial one-off edit or read.

## Authoring flow

1. Write a JSON workflow.
2. Run `dry-run` first.
3. Review proof bundle warnings or approval requirements.
4. Run the workflow.
5. If elevated steps pause, approve exact steps and resume.
6. If interrupted, recover before resuming.

## Required habits

- keep workflows narrow and typed
- prefer safe lanes before elevated lanes
- use `review_before_replay` for side-effectful elevated steps
- treat the compiled policy artifact as binding truth

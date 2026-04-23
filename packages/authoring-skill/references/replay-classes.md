# Replay Classes

## `read_only`

Use for steps that only inspect state and can be replayed freely.

Examples:
- `read_file`
- `list_files`

## `idempotent`

Use for steps whose repeat execution is acceptable in the local profile.

Examples:
- note generation
- deterministic local summaries

## `review_before_replay`

Use for elevated or materially side-effectful steps.

Examples:
- `exec_command`
- `apply_patch`

If interrupted after grant consumption without a terminal receipt, recovery should quarantine rather than silently replay.

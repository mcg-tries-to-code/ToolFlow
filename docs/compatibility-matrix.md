# Compatibility Matrix

## Current reality

| Surface | Status | Notes |
|---|---|---|
| Node.js | Supported | Built and tested on Node 25.x in this workspace |
| npm workspaces | Supported | Local build path uses `npm` workspaces |
| TypeScript | Supported | Builds with local `typescript` dev dependency |
| Local CLI | Supported | `validate`, `dry-run`, `run`, `resume`, `approve`, `recover`, `status`, `inspect`, `doctor` |
| Safe Profile ordinary cells | Supported | `read`, `research`, `session` |
| Safe Profile actions | Supported | `read_file`, `list_files`, `research_note`, `session_note` |
| Recovery engine | Supported | Requeues replayable interrupted steps and quarantines `review_before_replay` steps |
| Separate elevated package | Supported | `packages/elevated`, approval-bound and local-only |
| Elevated actions | Supported, opt-in local profile | `exec_command`, `apply_patch`, approval-bound, allowlist-gated |
| Separate signing domains | Supported | ordinary and elevated keys split under ledger `keys/` |
| Plugin package | Supported | `packages/plugin` provides local runtime-backed helpers for the local profile |
| Multi-host transport | Not supported | Local-only |
| Hardened IPC transport | Not supported | Current bridge posture remains local-process oriented |
| YAML workflow authoring | Not supported | JSON only |
| Outbound messaging lane | Not supported | Intentionally absent |

## Compatibility stance

This implementation is compatible with the current workspace as a **local ToolFlow distribution with recovery, packaging surfaces, and opt-in elevated mode**.
It is intentionally scoped to the local profile rather than pretending to be a distributed or generic automation substrate.

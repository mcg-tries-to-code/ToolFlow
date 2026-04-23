# Security Model

The Safe Profile MVP preserves the v5 authority model while keeping the process layout small.

Authority lives in signed per-step grants, not in standing cell credentials.
Each grant is bound to:
- run id
- step id
- cell id
- bridge id
- action family
- exact payload hash
- compiled policy hash
- replay class
- expiration time
- signing key id

The ordinary development signing key is stored under `toolflow/data/ledger/keys/ordinary-dev-key.json` with local filesystem permissions.
This is acceptable for local MVP development only.
Before any elevated profile ships, key management must move to a stronger operator contract with separate ordinary/elevated keys, rotation notes, and OS keychain or explicit secret-store guidance.

The Safe Profile bridge/cell same-process implementation is allowed only because the bridge contract remains typed and enforced.
It is not a generic tool invocation surface.

Binding policy truth is the compiled `policy-artifact.json`, not workflow source hints.
Bridges reject mismatched policy hashes, payload hashes, cell bindings, action bindings, expired grants, invalid signatures, and already-consumed grants.

Current safe-profile exclusions for public distribution posture:
- no shell execution in ordinary lanes
- no session-lane script launchers
- no outbound messaging by default
- no generic `/tools/invoke` ABI for ordinary execution

Elevated actions exist, but remain:
- disabled by default
- approval-bound per step
- explicitly allowlisted
- local-development oriented unless a stronger operator security model is added

Recovery is limited to ledger inspection in the MVP.
Crash replay fixtures are required before elevated work begins.

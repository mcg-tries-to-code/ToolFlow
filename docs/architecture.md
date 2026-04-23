# Architecture

ToolFlow v5 is a compiler, classifier, policy artifact generator, ledgered control plane, and typed execution fabric.

For the Safe Profile MVP, the runtime is deliberately narrow:
- workflow source is JSON with straight-line dependency steps
- ordinary actions are `read_file`, `list_files`, `research_note`, and `session_note`
- ordinary cells are `read`, `research`, and `session`
- bridge and cell run in the same local process
- typed bridge contracts still enforce signed grants, exact payload hashes, policy hashes, action family, cell binding, and single-use grant state
- receipts are persisted as the canonical execution record

Canonical state lives in `toolflow/data/ledger/`.
Run directories contain `workflow.json`, `compiled-graph.json`, `proof-bundle.json`, `policy-artifact.json`, `manifest.json`, append-only `events.jsonl`, grants, receipts, and step output artifacts.

Derived or explanatory artifacts may live under `toolflow/docs/` and `toolflow/packages/examples/`.
They must not be treated as canonical truth when they disagree with the ledger.

The elevated lane is intentionally absent from the MVP.

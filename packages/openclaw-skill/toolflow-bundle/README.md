# ToolFlow OpenClaw Bundle

This bundle is packaged inside the ClawHub skill so OpenClaw users can install ToolFlow with a local link-based plugin install instead of manually assembling the runtime.

Layout:
- `packages/plugin` - OpenClaw plugin entry and manifest
- `packages/runtime` - ToolFlow runtime bundle
- `packages/shared` - shared contracts bundle
- `packages/elevated` - elevated lane bundle
- `packages/examples` - verification workflows
- `node_modules/@toolflow/*` - local package shims for runtime resolution

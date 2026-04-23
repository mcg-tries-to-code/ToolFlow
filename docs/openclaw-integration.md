# ToolFlow OpenClaw Integration

ToolFlow is best exposed to OpenClaw as two coordinated surfaces:

1. a **plugin/runtime integration** that provides submit, status, inspect, receipts, cancel, recover, and controller/mirror operations
2. a **skill layer** that teaches an agent when and how to use ToolFlow rather than improvising long-running work in raw conversation turns

## Why both are useful

The plugin provides capability.
The skill provides judgment.

Without the plugin, the skill has no real execution substrate.
Without the skill, the plugin is just a blunt instrument with a respectable vocabulary.

## Recommended packaging model

- canonical source of truth: the ToolFlow repository
- OpenClaw plugin package: `packages/plugin`
- OpenClaw skill wrapper: `packages/openclaw-skill`
- authoring skill for workflow construction: `packages/authoring-skill`

This keeps the runtime, integration, and operator behavior related but not confused.

## Current install posture

Today the ClawHub skill is an operator wrapper, not a full runtime bundle.

That means:
- installing `toolflow-openclaw-operator` teaches the agent when to use ToolFlow
- users must still clone/build the ToolFlow runtime from GitHub

Current quick install path:

```sh
git clone https://github.com/mcg-tries-to-code/ToolFlow.git ~/.openclaw/toolflow
cd ~/.openclaw/toolflow
npm install && npm run build
```

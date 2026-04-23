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

The ClawHub package now ships as a bundled installer skill.

That means:
- installing `toolflow-openclaw-operator` provides the operator skill plus a bundled local plugin/runtime payload
- users can install the ToolFlow plugin from the installed skill folder with the included installer script
- the bundled installer and verifier are Bash-portable and have been smoke-tested on a clean Ubuntu VPS
- the canonical GitHub repository remains the source of truth for source updates and documentation

Current quick install path after ClawHub install:

```sh
./scripts/install-toolflow-openclaw.sh
./scripts/verify-toolflow-openclaw.sh
```

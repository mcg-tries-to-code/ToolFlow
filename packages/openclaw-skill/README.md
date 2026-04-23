# ToolFlow OpenClaw Operator

ClawHub skill wrapper for operating ToolFlow from within OpenClaw.

This skill helps the agent decide when work should be handled as a ToolFlow job instead of improvised in a single turn.

## Quick install

Installing this skill alone does **not** install the ToolFlow runtime.

To install the runtime alongside this skill:

```sh
git clone https://github.com/mcg-tries-to-code/ToolFlow.git ~/.openclaw/toolflow
cd ~/.openclaw/toolflow
npm install && npm run build
```

Then verify the local runtime:

```sh
cd ~/.openclaw/toolflow
node packages/runtime/dist/main.js doctor
node packages/runtime/dist/main.js validate packages/examples/workflows/safe-profile-mvp.json
```

Repository:
- <https://github.com/mcg-tries-to-code/ToolFlow>

Use it for:
- multi-step workflows
- approval-bound elevated work
- recoverable long-running jobs
- progress-visible execution

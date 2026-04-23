#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_MAIN="$SKILL_DIR/toolflow-bundle/packages/runtime/dist/main.js"
WORKFLOW="$SKILL_DIR/toolflow-bundle/packages/examples/workflows/safe-profile-mvp.json"

node "$RUNTIME_MAIN" doctor
node "$RUNTIME_MAIN" validate "$WORKFLOW"

echo "ToolFlow bundle verification complete."

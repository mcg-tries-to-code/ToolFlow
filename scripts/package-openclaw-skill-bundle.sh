#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKILL_DIR="$ROOT_DIR/packages/openclaw-skill"
BUNDLE_DIR="$SKILL_DIR/toolflow-bundle"
PACKAGES_DIR="$BUNDLE_DIR/packages"
NODE_MODULES_DIR="$BUNDLE_DIR/node_modules/@toolflow"

rm -rf "$BUNDLE_DIR"
mkdir -p "$PACKAGES_DIR" "$NODE_MODULES_DIR"

copy_package() {
  local name="$1"
  local src="$ROOT_DIR/packages/$name"
  local dst="$PACKAGES_DIR/$name"
  mkdir -p "$dst"
  cp "$src/package.json" "$dst/package.json"
  if [[ -f "$src/openclaw-plugin.json" ]]; then
    cp "$src/openclaw-plugin.json" "$dst/openclaw-plugin.json"
  fi
  if [[ -f "$src/openclaw.plugin.json" ]]; then
    cp "$src/openclaw.plugin.json" "$dst/openclaw.plugin.json"
  fi
  if [[ -d "$src/dist" ]]; then
    cp -R "$src/dist" "$dst/dist"
  fi
}

copy_node_module() {
  local name="$1"
  local src="$ROOT_DIR/packages/$name"
  local dst="$NODE_MODULES_DIR/$name"
  mkdir -p "$dst"
  cp "$src/package.json" "$dst/package.json"
  if [[ -d "$src/dist" ]]; then
    cp -R "$src/dist" "$dst/dist"
  fi
}

copy_package shared
copy_package elevated
copy_package runtime
copy_package plugin

mkdir -p "$PACKAGES_DIR/examples"
cp "$ROOT_DIR/packages/examples/README.md" "$PACKAGES_DIR/examples/README.md"
cp -R "$ROOT_DIR/packages/examples/workflows" "$PACKAGES_DIR/examples/workflows"

copy_node_module shared
copy_node_module elevated
copy_node_module runtime

cat > "$BUNDLE_DIR/README.md" <<'EOF'
# ToolFlow OpenClaw Bundle

This bundle is packaged inside the ClawHub skill so OpenClaw users can install ToolFlow with a local link-based plugin install instead of manually assembling the runtime.

Layout:
- `packages/plugin` - OpenClaw plugin entry and manifest
- `packages/runtime` - ToolFlow runtime bundle
- `packages/shared` - shared contracts bundle
- `packages/elevated` - elevated lane bundle
- `packages/examples` - verification workflows
- `node_modules/@toolflow/*` - local package shims for runtime resolution
EOF

printf 'Bundled ToolFlow OpenClaw assets at %s\n' "$BUNDLE_DIR"

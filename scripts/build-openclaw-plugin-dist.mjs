#!/usr/bin/env node
import { build } from 'esbuild';
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const skillDir = resolve(rootDir, 'packages/openclaw-skill');
const bundleDir = resolve(skillDir, 'toolflow-bundle');
const pluginDir = resolve(bundleDir, 'plugin');
const distDir = resolve(pluginDir, 'dist');
const examplesDir = resolve(pluginDir, 'examples/workflows');

const rootPackage = JSON.parse(readFileSync(resolve(rootDir, 'package.json'), 'utf8'));
const pluginManifest = readFileSync(resolve(rootDir, 'packages/plugin/openclaw.plugin.json'), 'utf8');

rmSync(bundleDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(examplesDir, { recursive: true });

await build({
  entryPoints: [resolve(rootDir, 'packages/plugin/dist/entry.js')],
  outfile: resolve(distDir, 'entry.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  sourcemap: true,
  logLevel: 'info'
});

await build({
  entryPoints: [resolve(rootDir, 'packages/runtime/dist/main.js')],
  outfile: resolve(distDir, 'runtime-cli.js'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  sourcemap: true,
  logLevel: 'info'
});

cpSync(resolve(rootDir, 'packages/examples/workflows'), examplesDir, { recursive: true });
writeFileSync(resolve(pluginDir, 'openclaw.plugin.json'), pluginManifest);
writeFileSync(resolve(pluginDir, 'package.json'), `${JSON.stringify({
  name: '@toolflow/openclaw-bundled-plugin',
  version: rootPackage.version,
  type: 'commonjs',
  main: 'dist/entry.js',
  description: 'Bundled ToolFlow runtime plugin for OpenClaw.',
  openclaw: {
    extensions: ['./dist/entry.js']
  }
}, null, 2)}\n`);
writeFileSync(resolve(bundleDir, 'README.md'), `# ToolFlow OpenClaw Bundle\n\nThis bundle is generated for the ClawHub skill and contains a self-contained OpenClaw plugin package.\n\nLayout:\n- \`plugin/\` - installable OpenClaw plugin package\n  - \`dist/entry.js\` - bundled OpenClaw extension entry\n  - \`dist/runtime-cli.js\` - bundled ToolFlow CLI for doctor/validate checks\n  - \`examples/workflows/\` - packaged example workflows\n`);

console.log(`Bundled flattened ToolFlow OpenClaw plugin at ${pluginDir}`);

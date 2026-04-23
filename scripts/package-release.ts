import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";

const root = resolve(process.cwd());
const dist = resolve(root, "dist-release");
mkdirSync(dist, { recursive: true });

const artifacts = [
  "packages/shared/dist",
  "packages/elevated/dist",
  "packages/runtime/dist",
  "packages/plugin/dist",
  "README.md",
  "docs/install.md",
  "docs/toolflow-overview.md",
  "docs/authorship-and-attribution.md",
  "docs/publication-readiness.md",
  "docs/compatibility-matrix.md",
  "docs/operator-playbook.md"
].map((path) => resolve(root, path));

const manifest = {
  createdAt: new Date().toISOString(),
  root,
  artifacts: artifacts.map((path) => ({ path, exists: existsSync(path), name: basename(path) }))
};

writeFileSync(resolve(dist, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
process.stdout.write(JSON.stringify({ ok: true, manifest: resolve(dist, "release-manifest.json") }, null, 2) + "\n");

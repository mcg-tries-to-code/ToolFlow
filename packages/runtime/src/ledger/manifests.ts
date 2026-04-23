import type { RunManifest } from "@toolflow/shared";
import { nowIso } from "@toolflow/shared";
import type { LedgerStore } from "./store";

export function writeManifest(store: LedgerStore, manifest: RunManifest): void {
  manifest.updatedAt = nowIso();
  store.writeJson(store.runPath(manifest.runId, "manifest.json"), manifest);
}

export function readManifest(store: LedgerStore, runId: string): RunManifest {
  return store.readJson<RunManifest>(store.runPath(runId, "manifest.json"));
}

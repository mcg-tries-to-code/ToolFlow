import type { CompiledGraph, RunManifest } from "@toolflow/shared";
import type { LedgerStore } from "./store";
import { readManifest } from "./manifests";
import { listReceipts } from "./receipts";
import { listCheckpoints } from "./checkpoints";

export function readRecoveryBundle(store: LedgerStore, runId: string): { manifest: RunManifest; graph: CompiledGraph; receipts: unknown[]; checkpoints: unknown[] } {
  const manifest = readManifest(store, runId);
  return {
    manifest,
    graph: store.readJson<CompiledGraph>(store.runPath(runId, "compiled-graph.json")),
    receipts: listReceipts(store, runId),
    checkpoints: listCheckpoints(store, runId)
  };
}

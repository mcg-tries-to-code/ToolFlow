import type { CheckpointRecord } from "@toolflow/shared";
import type { LedgerStore } from "./store";

export function writeCheckpoint(store: LedgerStore, checkpoint: CheckpointRecord): void {
  store.writeJson(store.runPath(checkpoint.runId, "checkpoints", `${checkpoint.stepId}.json`), checkpoint);
}

export function readCheckpoint(store: LedgerStore, runId: string, stepId: string): CheckpointRecord | undefined {
  try {
    return store.readJson<CheckpointRecord>(store.runPath(runId, "checkpoints", `${stepId}.json`));
  } catch {
    return undefined;
  }
}

export function listCheckpoints(store: LedgerStore, runId: string): CheckpointRecord[] {
  return store.listJsonFiles(store.runPath(runId, "checkpoints")).map((path) => store.readJson<CheckpointRecord>(path));
}

import type { ProofBundle } from "@toolflow/shared";
import type { LedgerStore } from "./store";

export function writeProofBundle(store: LedgerStore, runId: string, proof: ProofBundle): void {
  store.writeJson(store.runPath(runId, "proof-bundle.json"), proof);
}

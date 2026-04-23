import type { PolicyArtifact } from "@toolflow/shared";
import type { LedgerStore } from "./store";

export function writePolicyArtifact(store: LedgerStore, runId: string, policy: PolicyArtifact): void {
  store.writeJson(store.runPath(runId, "policy-artifact.json"), policy);
}

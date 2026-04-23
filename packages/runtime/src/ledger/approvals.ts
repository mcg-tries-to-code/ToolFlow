import type { ApprovalBinding } from "@toolflow/shared";
import type { LedgerStore } from "./store";

export function writeApproval(store: LedgerStore, binding: ApprovalBinding): void {
  store.writeJson(store.runPath(binding.runId, "approvals", `${binding.stepId}.json`), binding);
}

export function readApproval(store: LedgerStore, runId: string, stepId: string): ApprovalBinding | undefined {
  try {
    return store.readJson<ApprovalBinding>(store.runPath(runId, "approvals", `${stepId}.json`));
  } catch {
    return undefined;
  }
}

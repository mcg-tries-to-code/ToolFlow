import type { PolicyArtifact, SafeActionFamily, SafeCellId } from "@toolflow/shared";

export function evaluateBridgePolicy(policy: PolicyArtifact, cell: SafeCellId, action: SafeActionFamily): boolean {
  return (policy.allowedActionsByCell[cell] ?? []).includes(action);
}

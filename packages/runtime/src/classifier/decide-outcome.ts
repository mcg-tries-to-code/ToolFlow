import type { PreflightDecision } from "@toolflow/shared";

export function decideOutcome(failures: string[], warnings: string[], requiresApproval = false): PreflightDecision {
  if (failures.length) return "reject";
  if (requiresApproval) return "requires_approval";
  if (warnings.length) return "allow_with_warnings";
  return "allow";
}

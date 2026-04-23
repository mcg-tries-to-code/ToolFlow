import { PolicyError } from "@toolflow/shared";
import type { ApprovalBinding, BridgeRequest } from "@toolflow/shared";

export function ensureApprovalForElevatedRequest(request: BridgeRequest, approval?: ApprovalBinding): void {
  const approvalHash = request.grant.approvalHash;
  if (!approvalHash) throw new PolicyError("Elevated grant is missing approval binding.");
  if (!approval) throw new PolicyError("Elevated approval binding was not found.");
  if (approval.approvalHash !== approvalHash) throw new PolicyError("Elevated approval hash mismatch.");
  if (approval.approvedPayloadHash !== request.grant.payloadHash) throw new PolicyError("Elevated approval payload binding mismatch.");
  if (approval.policyHash !== request.grant.policyHash) throw new PolicyError("Elevated approval policy binding mismatch.");
}

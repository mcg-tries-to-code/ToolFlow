import { PolicyError } from "@toolflow/shared";
import type { BridgeRequest } from "@toolflow/shared";
import { readApproval } from "../../ledger/approvals";
import type { LedgerStore } from "../../ledger/store";

export function ensureApprovalForElevatedRequest(store: LedgerStore, request: BridgeRequest): void {
  const approvalHash = request.grant.approvalHash;
  if (!approvalHash) throw new PolicyError("Elevated grant is missing approval binding.");
  const approval = readApproval(store, request.grant.runId, request.grant.stepId);
  if (!approval) throw new PolicyError("Elevated approval binding was not found.");
  if (approval.approvalHash !== approvalHash) throw new PolicyError("Elevated approval hash mismatch.");
  if (approval.approvedPayloadHash !== request.grant.payloadHash) throw new PolicyError("Elevated approval payload binding mismatch.");
  if (approval.policyHash !== request.grant.policyHash) throw new PolicyError("Elevated approval policy binding mismatch.");
}

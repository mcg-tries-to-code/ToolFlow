import type { Hash } from "../hashing";
import type { RunId } from "../ids";

export interface ApprovalBinding {
  schemaVersion: "toolflow.approval-binding/v1";
  runId: RunId;
  stepId: string;
  approvalHash: Hash;
  approvedPayloadHash: Hash;
  policyHash: Hash;
  approvedAt: string;
  approvedBy: string;
  approvalMode: "step-time";
}

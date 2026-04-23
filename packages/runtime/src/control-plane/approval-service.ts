import { hashJson, nowIso } from "@toolflow/shared";
import type { ApprovalBinding, CompiledStep, Hash, RunId } from "@toolflow/shared";
import { readApproval, writeApproval } from "../ledger/approvals";
import type { LedgerStore } from "../ledger/store";

export function getStepApproval(store: LedgerStore, runId: RunId, stepId: string): ApprovalBinding | undefined {
  return readApproval(store, runId, stepId);
}

export function approveStep(store: LedgerStore, runId: RunId, step: CompiledStep, policyHash: Hash, approvedBy: string): ApprovalBinding {
  const approvedAt = nowIso();
  const approval: ApprovalBinding = {
    schemaVersion: "toolflow.approval-binding/v1",
    runId,
    stepId: step.id,
    approvedPayloadHash: step.payloadHash,
    policyHash,
    approvedAt,
    approvedBy,
    approvalMode: "step-time",
    approvalHash: hashJson({ runId, stepId: step.id, approvedPayloadHash: step.payloadHash, policyHash, approvedAt, approvedBy, approvalMode: "step-time" })
  };
  writeApproval(store, approval);
  return approval;
}

import type { ApprovalBinding } from "../types/approvals";
import { hasString, isRecord } from "./helpers";

export function isApprovalBinding(value: unknown): value is ApprovalBinding {
  return isRecord(value) && value.schemaVersion === "toolflow.approval-binding/v1" && hasString(value, "runId") && hasString(value, "stepId") && hasString(value, "approvalHash");
}

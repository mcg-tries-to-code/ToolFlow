import { createRuntimeClient } from "../client/runtime-client";

export function toolflow_receipts(runId?: string) {
  return createRuntimeClient().receipts(runId);
}

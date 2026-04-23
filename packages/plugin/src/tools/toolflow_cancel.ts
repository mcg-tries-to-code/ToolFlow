import { createRuntimeClient } from "../client/runtime-client";

export function toolflow_cancel(runId: string, reason?: string) {
  return createRuntimeClient().cancel(runId, reason);
}

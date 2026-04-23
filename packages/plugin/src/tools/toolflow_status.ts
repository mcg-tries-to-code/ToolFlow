import { createRuntimeClient } from "../client/runtime-client";

export function toolflow_status(runId?: string) {
  return createRuntimeClient().status(runId);
}

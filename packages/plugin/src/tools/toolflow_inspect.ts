import { createRuntimeClient } from "../client/runtime-client";

export function toolflow_inspect(runId?: string) {
  return createRuntimeClient().inspect(runId);
}

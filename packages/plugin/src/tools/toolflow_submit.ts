import { createRuntimeClient } from "../client/runtime-client";

export function toolflow_submit(workflowPath: string) {
  return createRuntimeClient().submit(workflowPath);
}

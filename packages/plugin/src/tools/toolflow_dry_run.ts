import { createRuntimeClient } from "../client/runtime-client";

export function toolflow_dry_run(workflowPath: string) {
  return createRuntimeClient().dryRun(workflowPath);
}

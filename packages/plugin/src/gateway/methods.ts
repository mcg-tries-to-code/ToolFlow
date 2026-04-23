import { createRuntimeClient } from "../client/runtime-client";

export const gatewayMethods = {
  toolflow_submit: (workflowPath: string) => createRuntimeClient().submit(workflowPath),
  toolflow_dry_run: (workflowPath: string) => createRuntimeClient().dryRun(workflowPath),
  toolflow_status: (runId?: string) => createRuntimeClient().status(runId),
  toolflow_inspect: (runId?: string) => createRuntimeClient().inspect(runId),
  toolflow_receipts: (runId?: string) => createRuntimeClient().receipts(runId),
  toolflow_cancel: (runId: string, reason?: string) => createRuntimeClient().cancel(runId, reason),
  toolflow_recover: (runId: string) => createRuntimeClient().recover(runId),
  toolflow_taskflow_mirror_status: () => createRuntimeClient().taskflowMirrorStatus(),
  toolflow_taskflow_mirror_read: (runId: string) => createRuntimeClient().readTaskflowMirror(runId),
  toolflow_controller_status: () => createRuntimeClient().controllerStatus(),
  toolflow_controller_create: (input: Parameters<ReturnType<typeof createRuntimeClient>["createControllerFlow"]>[0]) => createRuntimeClient().createControllerFlow(input),
  toolflow_controller_read: (flowId: string) => createRuntimeClient().readControllerFlow(flowId),
  toolflow_controller_list: () => createRuntimeClient().listControllerFlows(),
  toolflow_controller_launch: (input: Parameters<ReturnType<typeof createRuntimeClient>["launchControllerWorkflow"]>[0]) => createRuntimeClient().launchControllerWorkflow(input),
  toolflow_controller_reconcile: (flowId: string) => createRuntimeClient().reconcileControllerFlow(flowId)
};

import { approveRunStep, cancelRun, controllerStatus, createControllerFlow, createLedger, dryRun, getRunReceipts, getRunStatus, inspectRun, launchControllerWorkflow, listControllerFlows, readControllerFlow, readTaskflowMirror, recoverRun, reconcileControllerFlow, resumeWorkflow, runWorkflow, taskflowMirrorStatus, updateControllerFlow } from "../../../runtime/dist/index";
import type { ToolflowPluginConfig } from "../config-schema";

export function createRuntimeClient(config: ToolflowPluginConfig = {}) {
  const runtimeConfig = {
    ledgerRoot: config.ledgerRoot,
    taskflowMirrorRoot: config.taskflowMirrorRoot,
    enableElevated: config.enableElevated,
    elevatedAllowedCommands: config.elevatedAllowedCommands,
    progressUpdates: {
      enabled: true,
      longRunThresholdMs: 5 * 60 * 1000,
      intervalMs: 5 * 60 * 1000,
      sink: "stderr" as const,
      ...config.progressUpdates
    }
  };

  return {
    submit: (workflowPath: string) => runWorkflow(workflowPath, runtimeConfig),
    dryRun: (workflowPath: string) => dryRun(workflowPath),
    status: (runId?: string) => getRunStatus(runId, runtimeConfig),
    inspect: (runId?: string) => inspectRun(runId, runtimeConfig),
    receipts: (runId?: string) => getRunReceipts(runId, runtimeConfig),
    approve: (runId: string, stepId: string, approvedBy?: string) => approveRunStep(runId, stepId, approvedBy, runtimeConfig),
    cancel: (runId: string, reason?: string) => cancelRun(runId, reason, runtimeConfig),
    resume: (runId: string) => resumeWorkflow(runId, runtimeConfig),
    recover: (runId: string) => recoverRun(createLedger(runtimeConfig), runId),
    taskflowMirrorStatus: () => taskflowMirrorStatus(runtimeConfig),
    readTaskflowMirror: (runId: string) => readTaskflowMirror(runId, runtimeConfig),
    controllerStatus: () => controllerStatus(runtimeConfig),
    createControllerFlow: (input: Parameters<typeof createControllerFlow>[0]) => createControllerFlow(input, runtimeConfig),
    readControllerFlow: (flowId: string) => readControllerFlow(flowId, runtimeConfig),
    listControllerFlows: () => listControllerFlows(runtimeConfig),
    launchControllerWorkflow: (input: Parameters<typeof launchControllerWorkflow>[0]) => launchControllerWorkflow(input, runtimeConfig),
    reconcileControllerFlow: (flowId: string) => reconcileControllerFlow(flowId, runtimeConfig),
    updateControllerFlow: (flowId: string, patch: Parameters<typeof updateControllerFlow>[1]) => updateControllerFlow(flowId, patch, runtimeConfig)
  };
}

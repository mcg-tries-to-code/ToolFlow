import type { RunManifest } from "@toolflow/shared";

export interface RuntimeProgressEvent {
  type: "run_started" | "long_running" | "step_started" | "step_completed" | "approval_wait" | "run_completed";
  runId: string;
  workflowName: string;
  state: RunManifest["state"];
  elapsedMs: number;
  completedSteps: number;
  totalSteps: number;
  currentStepId?: string;
  message: string;
  emittedAt: string;
}

export interface RuntimeProgressConfig {
  enabled: boolean;
  longRunThresholdMs: number;
  intervalMs: number;
  sink: "stderr" | "command";
  command?: string;
}

export interface RuntimeConfig {
  ledgerRoot: string;
  taskflowMirrorRoot: string;
  grantTtlSeconds: number;
  enableElevated: boolean;
  elevatedAllowedCommands: string[];
  progressUpdates: RuntimeProgressConfig;
  progressReporter?: (event: RuntimeProgressEvent) => void | Promise<void>;
}

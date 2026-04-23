export type ControllerFlowStatus = "running" | "waiting" | "blocked" | "done" | "failed" | "cancelled";

export type WakeReason =
  | { kind: "toolflow_completed"; runId: string }
  | { kind: "toolflow_approval_required"; runId: string; stepId?: string }
  | { kind: "time"; wakeAt: string }
  | { kind: "external_reply"; channel: string; threadKey: string }
  | { kind: "manual"; actor: string }
  | { kind: "fallback_sweep" };

export type LinkedRunStatus =
  | "ready"
  | "running"
  | "awaiting_approval"
  | "succeeded"
  | "failed"
  | "quarantined"
  | "cancelled"
  | "rejected";

export interface LinkedToolflowRun {
  kind: "toolflow";
  runId: string;
  purpose: string;
  status: LinkedRunStatus;
  workflowName?: string;
  lastSeenAt?: string;
}

export interface ControllerState {
  version: 1;
  goal: string;
  doneDefinition: string;
  blockerDefinition: string;
  planVersion: number;
  currentObjective: string;
  linkedRuns: LinkedToolflowRun[];
  pendingDecisions: string[];
  artifacts: string[];
  lastMaterialProgressAt: string;
}

export interface TaskFlowBinding {
  createManaged(input: {
    controllerId: string;
    goal: string;
    currentStep: string;
    stateJson: ControllerState;
  }): Promise<{ flowId: string; revision: number }>;
  setWaiting(input: {
    flowId: string;
    expectedRevision: number;
    currentStep: string;
    stateJson: ControllerState;
    waitJson: unknown;
    blockedSummary?: string;
  }): Promise<{ applied: boolean; flow: { flowId: string; revision: number; stateJson: ControllerState } }>;
  resume(input: {
    flowId: string;
    expectedRevision: number;
    status: "running";
    currentStep: string;
    stateJson: ControllerState;
  }): Promise<{ applied: boolean; flow: { flowId: string; revision: number; stateJson: ControllerState } }>;
  finish(input: {
    flowId: string;
    expectedRevision: number;
    stateJson: ControllerState;
  }): Promise<void>;
  fail(input: {
    flowId: string;
    expectedRevision: number;
    stateJson: ControllerState;
    blockedSummary: string;
  }): Promise<void>;
}

export interface ToolflowBinding {
  startRun(input: {
    workflowPath: string;
    purpose: string;
  }): Promise<{ runId: string; workflowName?: string; state: LinkedRunStatus }>;
  getRunStatus(runId: string): Promise<{ runId: string; state: LinkedRunStatus; workflowName?: string }>;
}

export interface ControllerDecision {
  status: ControllerFlowStatus;
  currentStep: string;
  state: ControllerState;
  waitJson?: unknown;
  blockedSummary?: string;
  launchWorkflowPath?: string;
  launchPurpose?: string;
}

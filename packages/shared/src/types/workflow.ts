import type { Hash } from "../hashing";

export type SafeCellId = "read" | "research" | "session" | "elevated";
export type SafeActionFamily = "read_file" | "list_files" | "research_note" | "session_note" | "health_downtrend_monitor" | "workspace_governance_monthly" | "exec_command" | "apply_patch";
export type ReplayClass = "read_only" | "idempotent" | "review_before_replay";
export type RunState = "created" | "compiled" | "ready" | "running" | "awaiting_approval" | "quarantined" | "cancelled" | "succeeded" | "failed" | "rejected";
export type StepState = "pending" | "awaiting_approval" | "grant_issued" | "running" | "quarantined" | "cancelled" | "succeeded" | "failed" | "skipped";

export interface WorkflowSource {
  schemaVersion: "toolflow.workflow/v1";
  name: string;
  description?: string;
  inputs?: Record<string, string | number | boolean>;
  steps: WorkflowStepSource[];
}

export interface WorkflowStepSource {
  id: string;
  action: SafeActionFamily;
  cell?: SafeCellId;
  dependsOn?: string[];
  args?: Record<string, unknown>;
  replayClass?: ReplayClass;
}

export interface CompiledGraph {
  schemaVersion: "toolflow.compiled-graph/v1";
  workflowName: string;
  sourceHash: Hash;
  graphHash: Hash;
  nodes: CompiledStep[];
}

export interface CompiledStep {
  id: string;
  cell: SafeCellId;
  bridgeId: `${SafeCellId}-bridge-v1`;
  action: SafeActionFamily;
  dependsOn: string[];
  payload: Record<string, unknown>;
  payloadHash: Hash;
  replayClass: ReplayClass;
}

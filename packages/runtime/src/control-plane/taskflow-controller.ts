import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { nowIso } from "@toolflow/shared";
import type { RuntimeConfig } from "../config/schema";
import { resolveConfig } from "../config/resolve";
import type { RunManifest } from "@toolflow/shared";
import { runWorkflow } from "./run-service";
import { readTaskflowMirror, syncTaskflowMirrorFromLedger } from "./taskflow-mirror";

export type ControllerFlowStatus = "running" | "waiting" | "blocked" | "done" | "failed" | "cancelled";

export interface ControllerLinkedRun {
  runId: string;
  workflowPath: string;
  purpose: string;
  runState: RunManifest["state"];
  mirroredTaskflowState: "running" | "waiting" | "blocked" | "done" | "cancelled";
  attachedAt: string;
  updatedAt: string;
}

export interface ControllerFlowRecord {
  schemaVersion: "toolflow.taskflow-controller/v1";
  flowId: string;
  goal: string;
  doneDefinition: string;
  blockerDefinition: string;
  controllerId: string;
  status: ControllerFlowStatus;
  currentStep: string;
  nextAction: string;
  waitJson?: unknown;
  blockedSummary?: string;
  linkedRuns: ControllerLinkedRun[];
  artifacts: string[];
  createdAt: string;
  updatedAt: string;
  lastMaterialProgressAt: string;
  terminalSummary?: string;
}

export interface ControllerIndex {
  schemaVersion: "toolflow.taskflow-controller-index/v1";
  updatedAt: string;
  flows: Array<{
    flowId: string;
    goal: string;
    status: ControllerFlowStatus;
    currentStep: string;
    updatedAt: string;
  }>;
}

function controllerRoot(config: RuntimeConfig): string {
  return join(config.taskflowMirrorRoot, "controller");
}

function flowDir(config: RuntimeConfig): string {
  return join(controllerRoot(config), "flows");
}

function flowPath(config: RuntimeConfig, flowId: string): string {
  return join(flowDir(config), `${flowId}.json`);
}

function indexPath(config: RuntimeConfig): string {
  return join(controllerRoot(config), "index.json");
}

function ensureControllerRoot(config: RuntimeConfig): void {
  mkdirSync(flowDir(config), { recursive: true });
}

function newFlowId(): string {
  return `tfc_${Math.random().toString(16).slice(2, 14)}`;
}

function readIndex(config: RuntimeConfig): ControllerIndex {
  ensureControllerRoot(config);
  try {
    return JSON.parse(readFileSync(indexPath(config), "utf8")) as ControllerIndex;
  } catch {
    return {
      schemaVersion: "toolflow.taskflow-controller-index/v1",
      updatedAt: nowIso(),
      flows: [],
    };
  }
}

function writeIndex(config: RuntimeConfig, index: ControllerIndex): void {
  writeFileSync(indexPath(config), `${JSON.stringify(index, null, 2)}\n`);
}

function upsertIndex(config: RuntimeConfig, flow: ControllerFlowRecord): void {
  const index = readIndex(config);
  index.updatedAt = flow.updatedAt;
  index.flows = index.flows.filter((item) => item.flowId !== flow.flowId);
  index.flows.push({
    flowId: flow.flowId,
    goal: flow.goal,
    status: flow.status,
    currentStep: flow.currentStep,
    updatedAt: flow.updatedAt,
  });
  index.flows.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  writeIndex(config, index);
}

function saveFlow(config: RuntimeConfig, flow: ControllerFlowRecord): ControllerFlowRecord {
  ensureControllerRoot(config);
  writeFileSync(flowPath(config, flow.flowId), `${JSON.stringify(flow, null, 2)}\n`);
  upsertIndex(config, flow);
  return flow;
}

export function createControllerFlow(input: {
  goal: string;
  doneDefinition: string;
  blockerDefinition: string;
  controllerId: string;
  currentStep: string;
  nextAction: string;
  artifacts?: string[];
}, configInput: Partial<RuntimeConfig> = {}): ControllerFlowRecord {
  const config = resolveConfig(configInput);
  const timestamp = nowIso();
  const flow: ControllerFlowRecord = {
    schemaVersion: "toolflow.taskflow-controller/v1",
    flowId: newFlowId(),
    goal: input.goal,
    doneDefinition: input.doneDefinition,
    blockerDefinition: input.blockerDefinition,
    controllerId: input.controllerId,
    status: "running",
    currentStep: input.currentStep,
    nextAction: input.nextAction,
    linkedRuns: [],
    artifacts: input.artifacts ?? [],
    createdAt: timestamp,
    updatedAt: timestamp,
    lastMaterialProgressAt: timestamp,
  };
  return saveFlow(config, flow);
}

export function readControllerFlow(flowId: string, configInput: Partial<RuntimeConfig> = {}): ControllerFlowRecord {
  const config = resolveConfig(configInput);
  return JSON.parse(readFileSync(flowPath(config, flowId), "utf8")) as ControllerFlowRecord;
}

export function listControllerFlows(configInput: Partial<RuntimeConfig> = {}) {
  const config = resolveConfig(configInput);
  return readIndex(config);
}

export async function launchControllerWorkflow(input: {
  flowId: string;
  workflowPath: string;
  purpose: string;
}, configInput: Partial<RuntimeConfig> = {}): Promise<ControllerFlowRecord> {
  const config = resolveConfig(configInput);
  const flow = readControllerFlow(input.flowId, config);
  const manifest = await runWorkflow(input.workflowPath, config);
  const mirror = syncTaskflowMirrorFromLedger(manifest.runId, config);
  flow.linkedRuns.push({
    runId: manifest.runId,
    workflowPath: input.workflowPath,
    purpose: input.purpose,
    runState: manifest.state,
    mirroredTaskflowState: mirror.mirroredTaskflowState,
    attachedAt: nowIso(),
    updatedAt: manifest.updatedAt,
  });
  flow.currentStep = `toolflow:${manifest.workflowName}`;
  flow.nextAction = manifest.state === "succeeded"
    ? `Review linked ToolFlow run ${manifest.runId} and decide the next orchestration step.`
    : `Monitor linked ToolFlow run ${manifest.runId}.`;
  flow.updatedAt = nowIso();
  flow.lastMaterialProgressAt = flow.updatedAt;
  return saveFlow(config, flow);
}

export function reconcileControllerFlow(flowId: string, configInput: Partial<RuntimeConfig> = {}): ControllerFlowRecord {
  const config = resolveConfig(configInput);
  const flow = readControllerFlow(flowId, config);

  for (const linked of flow.linkedRuns) {
    const mirror = readTaskflowMirror(linked.runId, config);
    linked.runState = mirror.runState;
    linked.mirroredTaskflowState = mirror.mirroredTaskflowState;
    linked.updatedAt = mirror.updatedAt;

    if (mirror.mirroredTaskflowState === "waiting") {
      flow.status = "waiting";
      flow.currentStep = mirror.currentStep ?? flow.currentStep;
      flow.nextAction = mirror.waitingOn?.reason ?? `Await approval or wake for run ${linked.runId}.`;
      flow.waitJson = mirror.waitingOn;
    } else if (mirror.mirroredTaskflowState === "blocked") {
      flow.status = "blocked";
      flow.currentStep = mirror.currentStep ?? flow.currentStep;
      flow.nextAction = `Review blocked ToolFlow run ${linked.runId}.`;
      flow.blockedSummary = mirror.blockedSummary ?? `Linked run ${linked.runId} is blocked.`;
    } else if (mirror.mirroredTaskflowState === "done") {
      flow.status = "running";
      flow.nextAction = `Linked run ${linked.runId} finished. Evaluate completion or schedule the next workflow.`;
      flow.waitJson = undefined;
    } else if (mirror.mirroredTaskflowState === "cancelled") {
      flow.status = "cancelled";
      flow.terminalSummary = `Linked run ${linked.runId} was cancelled.`;
    }
  }

  flow.updatedAt = nowIso();
  return saveFlow(config, flow);
}

export function updateControllerFlow(flowId: string, patch: Partial<Pick<ControllerFlowRecord, "status" | "currentStep" | "nextAction" | "waitJson" | "blockedSummary" | "terminalSummary">>, configInput: Partial<RuntimeConfig> = {}): ControllerFlowRecord {
  const config = resolveConfig(configInput);
  const flow = readControllerFlow(flowId, config);
  Object.assign(flow, patch);
  flow.updatedAt = nowIso();
  flow.lastMaterialProgressAt = flow.updatedAt;
  return saveFlow(config, flow);
}

export function controllerStatus(configInput: Partial<RuntimeConfig> = {}) {
  const config = resolveConfig(configInput);
  ensureControllerRoot(config);
  const index = readIndex(config);
  const flowCount = readdirSync(flowDir(config), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .length;
  return {
    status: "enabled" as const,
    root: controllerRoot(config),
    flowCount,
    latestFlow: index.flows.at(-1),
    updatedAt: index.updatedAt,
  };
}

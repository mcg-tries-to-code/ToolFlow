import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { RunManifest } from "@toolflow/shared";
import type { RuntimeConfig } from "../config/schema";
import { resolveConfig } from "../config/resolve";
import { LedgerStore } from "../ledger/store";
import { readManifest } from "../ledger/manifests";

export type MirroredTaskflowState = "running" | "waiting" | "blocked" | "done" | "cancelled";

export interface TaskflowMirrorRecord {
  schemaVersion: "toolflow.taskflow-mirror/v1";
  runId: string;
  workflowName: string;
  runState: RunManifest["state"];
  mirroredTaskflowState: MirroredTaskflowState;
  currentStep?: string;
  waitingOn?: {
    kind: "approval" | "step";
    stepId?: string;
    reason: string;
  };
  blockedSummary?: string;
  doneSummary?: string;
  updatedAt: string;
  stepStates: Record<string, RunManifest["steps"][string]["state"]>;
}

interface TaskflowMirrorIndex {
  schemaVersion: "toolflow.taskflow-mirror-index/v1";
  updatedAt: string;
  runs: Array<{
    runId: string;
    workflowName: string;
    runState: RunManifest["state"];
    mirroredTaskflowState: MirroredTaskflowState;
    updatedAt: string;
  }>;
}

function mirrorRunDir(root: string): string {
  return join(root, "runs");
}

function mirrorRecordPath(root: string, runId: string): string {
  return join(mirrorRunDir(root), `${runId}.json`);
}

function mirrorIndexPath(root: string): string {
  return join(root, "index.json");
}

function ensureMirrorRoot(root: string): void {
  mkdirSync(mirrorRunDir(root), { recursive: true });
}

function readMirrorIndex(root: string): TaskflowMirrorIndex {
  ensureMirrorRoot(root);
  try {
    return JSON.parse(readFileSync(mirrorIndexPath(root), "utf8")) as TaskflowMirrorIndex;
  } catch {
    return {
      schemaVersion: "toolflow.taskflow-mirror-index/v1",
      updatedAt: new Date().toISOString(),
      runs: [],
    };
  }
}

function writeMirrorIndex(root: string, index: TaskflowMirrorIndex): void {
  writeFileSync(mirrorIndexPath(root), `${JSON.stringify(index, null, 2)}\n`);
}

export function mapRunStateToTaskflowState(manifest: RunManifest): MirroredTaskflowState {
  switch (manifest.state) {
    case "awaiting_approval":
      return "waiting";
    case "running":
    case "ready":
      return "running";
    case "failed":
    case "rejected":
    case "quarantined":
      return "blocked";
    case "cancelled":
      return "cancelled";
    case "succeeded":
      return "done";
    default:
      return "blocked";
  }
}

export function buildTaskflowMirrorRecord(manifest: RunManifest): TaskflowMirrorRecord {
  const stepEntries = Object.entries(manifest.steps);
  const awaitingApproval = stepEntries.find(([, step]) => step.state === "awaiting_approval");
  const running = stepEntries.find(([, step]) => step.state === "running");
  const failed = stepEntries.find(([, step]) => step.state === "failed");
  const mirroredTaskflowState = mapRunStateToTaskflowState(manifest);

  return {
    schemaVersion: "toolflow.taskflow-mirror/v1",
    runId: manifest.runId,
    workflowName: manifest.workflowName,
    runState: manifest.state,
    mirroredTaskflowState,
    currentStep: awaitingApproval?.[0] ?? running?.[0] ?? failed?.[0],
    waitingOn: awaitingApproval
      ? {
          kind: "approval",
          stepId: awaitingApproval[0],
          reason: `ToolFlow step ${awaitingApproval[0]} requires approval.`,
        }
      : undefined,
    blockedSummary: failed ? `ToolFlow step ${failed[0]} failed.` : manifest.state === "quarantined" ? `Run ${manifest.runId} is quarantined.` : undefined,
    doneSummary: manifest.state === "succeeded" ? `Run ${manifest.runId} completed successfully.` : undefined,
    updatedAt: manifest.updatedAt,
    stepStates: Object.fromEntries(stepEntries.map(([stepId, step]) => [stepId, step.state])),
  };
}

export function syncTaskflowMirror(store: LedgerStore, manifest: RunManifest, configInput: Partial<RuntimeConfig> = {}): TaskflowMirrorRecord {
  const config = resolveConfig(configInput);
  const root = config.taskflowMirrorRoot;
  ensureMirrorRoot(root);
  const record = buildTaskflowMirrorRecord(manifest);
  writeFileSync(mirrorRecordPath(root, manifest.runId), `${JSON.stringify(record, null, 2)}\n`);

  const index = readMirrorIndex(root);
  index.updatedAt = manifest.updatedAt;
  index.runs = index.runs.filter((run) => run.runId !== manifest.runId);
  index.runs.push({
    runId: manifest.runId,
    workflowName: manifest.workflowName,
    runState: manifest.state,
    mirroredTaskflowState: record.mirroredTaskflowState,
    updatedAt: manifest.updatedAt,
  });
  index.runs.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  writeMirrorIndex(root, index);
  store.appendEvent(manifest.runId, "taskflow.mirror_synced", {
    mirroredTaskflowState: record.mirroredTaskflowState,
    mirrorPath: mirrorRecordPath(root, manifest.runId),
  });
  return record;
}

export function readTaskflowMirror(runId: string, configInput: Partial<RuntimeConfig> = {}): TaskflowMirrorRecord {
  const config = resolveConfig(configInput);
  return JSON.parse(readFileSync(mirrorRecordPath(config.taskflowMirrorRoot, runId), "utf8")) as TaskflowMirrorRecord;
}

export function syncTaskflowMirrorFromLedger(runId: string, configInput: Partial<RuntimeConfig> = {}): TaskflowMirrorRecord {
  const config = resolveConfig(configInput);
  const store = new LedgerStore(config.ledgerRoot);
  const manifest = readManifest(store, runId);
  return syncTaskflowMirror(store, manifest, config);
}

export function taskflowMirrorStatus(configInput: Partial<RuntimeConfig> = {}) {
  const config = resolveConfig(configInput);
  ensureMirrorRoot(config.taskflowMirrorRoot);
  const index = readMirrorIndex(config.taskflowMirrorRoot);
  const runCount = readdirSync(mirrorRunDir(config.taskflowMirrorRoot), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .length;

  return {
    status: "enabled" as const,
    root: config.taskflowMirrorRoot,
    runCount,
    lastUpdatedAt: index.updatedAt,
    latestRun: index.runs.at(-1),
  };
}

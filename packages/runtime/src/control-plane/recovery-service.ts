import { isExpired } from "@toolflow/shared";
import type { CompiledGraph, ReplayDecision, RunManifest, RunState, StepManifest } from "@toolflow/shared";
import { readManifest, writeManifest } from "../ledger/manifests";
import { readGrant, expireGrant, voidGrant } from "../ledger/grants";
import { tryReadReceipt } from "../ledger/receipts";
import type { LedgerStore } from "../ledger/store";
import { replayDecision } from "../policy/replay-rules";
import { syncTaskflowMirror } from "./taskflow-mirror";

export interface RecoveryStepResult {
  stepId: string;
  previousState: StepManifest["state"];
  nextState: StepManifest["state"];
  disposition: "unchanged" | "reconciled_from_receipt" | "requeued" | "quarantined";
  reason: string;
}

export interface RecoveryReport {
  runId: RunManifest["runId"];
  previousState: RunState;
  nextState: RunState;
  steps: RecoveryStepResult[];
}

export function recoveryStatus(): string {
  return "Recovery engine enabled: grant requeue, receipt reconciliation, and quarantine for non-replayable interrupted steps.";
}

export function recoverRun(store: LedgerStore, runId: string): RecoveryReport {
  const manifest = readManifest(store, runId);
  const graph = store.readJson<CompiledGraph>(store.runPath(manifest.runId, "compiled-graph.json"));
  const previousState = manifest.state;
  const steps = graph.nodes.map((node) => recoverStep(store, manifest, node));
  manifest.state = deriveRunState(manifest);
  writeManifest(store, manifest);
  syncTaskflowMirror(store, manifest);
  store.appendEvent(manifest.runId, "run.recovered", { previousState, nextState: manifest.state, steps: steps.length });
  return { runId: manifest.runId, previousState, nextState: manifest.state, steps };
}

function recoverStep(store: LedgerStore, manifest: RunManifest, node: CompiledGraph["nodes"][number]): RecoveryStepResult {
  const step = manifest.steps[node.id];
  const previousState = step.state;
  if (["pending", "awaiting_approval", "quarantined", "succeeded", "failed", "skipped"].includes(step.state)) {
    return { stepId: node.id, previousState, nextState: step.state, disposition: "unchanged", reason: `Step already ${step.state}.` };
  }

  const receipt = tryReadReceipt(store, manifest.runId, step.receiptId);
  if (receipt) {
    step.state = receipt.status;
    step.receiptId = receipt.receiptId;
    step.endedAt = receipt.endedAt;
    if (receipt.error) step.error = receipt.error;
    return { stepId: node.id, previousState, nextState: step.state, disposition: "reconciled_from_receipt", reason: "Recovered terminal receipt from ledger." };
  }

  if (!step.grantId) {
    step.state = replayDecision(node.replayClass) === "review_required" ? "quarantined" : "pending";
    return {
      stepId: node.id,
      previousState,
      nextState: step.state,
      disposition: step.state === "quarantined" ? "quarantined" : "requeued",
      reason: "Interrupted step had no recoverable grant record."
    };
  }

  const grantRecord = readGrant(store, manifest.runId, step.grantId);
  const grantReceipt = tryReadReceipt(store, manifest.runId, grantRecord.receiptId);
  if (grantReceipt) {
    step.state = grantReceipt.status;
    step.receiptId = grantReceipt.receiptId;
    step.endedAt = grantReceipt.endedAt;
    if (grantReceipt.error) step.error = grantReceipt.error;
    return { stepId: node.id, previousState, nextState: step.state, disposition: "reconciled_from_receipt", reason: "Recovered receipt referenced by grant record." };
  }

  const replay = replayDecision(node.replayClass);
  if (grantRecord.state === "issued") {
    if (isExpired(grantRecord.grant.expiresAt)) expireGrant(store, manifest.runId, grantRecord.grant.grantId);
    else voidGrant(store, manifest.runId, grantRecord.grant.grantId);
    clearStepForReplay(step);
    return { stepId: node.id, previousState, nextState: step.state, disposition: "requeued", reason: "Unused interrupted grant was requeued for replay." };
  }

  if (grantRecord.state === "consumed") {
    if (replay === "review_required") {
      step.state = "quarantined";
      return { stepId: node.id, previousState, nextState: step.state, disposition: "quarantined", reason: "Consumed grant without receipt requires manual review before replay." };
    }
    clearStepForReplay(step);
    return { stepId: node.id, previousState, nextState: step.state, disposition: "requeued", reason: "Consumed grant without receipt was requeued because replay is allowed." };
  }

  if (grantRecord.state === "expired" || grantRecord.state === "void") {
    clearStepForReplay(step);
    return { stepId: node.id, previousState, nextState: step.state, disposition: "requeued", reason: `Grant was ${grantRecord.state}; step returned to pending.` };
  }

  return { stepId: node.id, previousState, nextState: step.state, disposition: "unchanged", reason: `Grant state ${grantRecord.state} required no adjustment.` };
}

function clearStepForReplay(step: StepManifest): void {
  step.state = "pending";
  delete step.grantId;
  delete step.startedAt;
}

function deriveRunState(manifest: RunManifest): RunState {
  const steps = Object.values(manifest.steps);
  if (steps.some((step) => step.state === "quarantined")) return "quarantined";
  if (steps.some((step) => step.state === "awaiting_approval")) return "awaiting_approval";
  if (steps.every((step) => step.state === "succeeded")) return "succeeded";
  if (steps.some((step) => step.state === "failed")) return "failed";
  if (steps.some((step) => ["pending", "grant_issued", "running"].includes(step.state))) return "ready";
  return manifest.state;
}

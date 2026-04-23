import { RUN_MANIFEST_SCHEMA_VERSION, hashJson, newRunId, nowIso } from "@toolflow/shared";
import type { RunId, RunManifest } from "@toolflow/shared";
import { loadElevatedRuntimeKey, loadRuntimeKey } from "../crypto/keyring";
import { compileWorkflowFile } from "../compiler/compile";
import { approveStep, getStepApproval } from "./approval-service";
import { buildProofBundle } from "../classifier/build-proof-bundle";
import { compilePolicyArtifact } from "../policy/compile-policy";
import { resolveConfig } from "../config/resolve";
import type { RuntimeConfig } from "../config/schema";
import { LedgerStore } from "../ledger/store";
import { writeManifest, readManifest } from "../ledger/manifests";
import { writeProofBundle } from "../ledger/proof-bundles";
import { writePolicyArtifact } from "../ledger/policy-artifacts";
import { listReceipts } from "../ledger/receipts";
import { mintStepGrant } from "./grant-service";
import { dispatchStep } from "./dispatcher";
import { recoverRun } from "./recovery-service";
import { nextRunnableSteps } from "./scheduler";
import { reconcileReceipt } from "./receipt-service";
import { syncTaskflowMirror } from "./taskflow-mirror";
import { createRunProgressMonitor } from "./progress-reporter";

function persistManifest(store: LedgerStore, manifest: RunManifest, config: Partial<RuntimeConfig> = {}): void {
  writeManifest(store, manifest);
  syncTaskflowMirror(store, manifest, config);
}

export function createLedger(config: Partial<RuntimeConfig> = {}): LedgerStore {
  return new LedgerStore(resolveConfig(config).ledgerRoot);
}

export async function prepareRun(workflowPath: string, configInput: Partial<RuntimeConfig> = {}): Promise<{ runId: RunId; manifest: RunManifest }> {
  const config = resolveConfig(configInput);
  const store = new LedgerStore(config.ledgerRoot);
  const { source, compiledGraph } = compileWorkflowFile(workflowPath);
  const proofBundle = buildProofBundle(compiledGraph, config);
  const policyArtifact = compilePolicyArtifact(compiledGraph, config);
  const runId = newRunId();
  store.ensureRun(runId);
  const createdAt = nowIso();
  const manifest: RunManifest = {
    schemaVersion: RUN_MANIFEST_SCHEMA_VERSION,
    runId,
    workflowName: source.name,
    state: proofBundle.decision === "reject" ? "rejected" : "ready",
    createdAt,
    updatedAt: createdAt,
    workflowHash: compiledGraph.sourceHash,
    graphHash: compiledGraph.graphHash,
    proofHash: proofBundle.proofHash,
    policyHash: policyArtifact.policyHash,
    steps: Object.fromEntries(compiledGraph.nodes.map((node) => [node.id, { id: node.id, state: "pending" }]))
  };
  store.writeJson(store.runPath(runId, "workflow.json"), source);
  store.writeJson(store.runPath(runId, "compiled-graph.json"), compiledGraph);
  writeProofBundle(store, runId, proofBundle);
  writePolicyArtifact(store, runId, policyArtifact);
  persistManifest(store, manifest, config);
  store.appendEvent(runId, "run.prepared", { workflowPath, decision: proofBundle.decision });
  return { runId, manifest };
}

export async function runWorkflow(workflowPath: string, configInput: Partial<RuntimeConfig> = {}): Promise<RunManifest> {
  const config = resolveConfig(configInput);
  const prepared = await prepareRun(workflowPath, config);
  return resumeWorkflow(prepared.runId, config);
}

export async function resumeWorkflow(runId: string, configInput: Partial<RuntimeConfig> = {}): Promise<RunManifest> {
  const config = resolveConfig(configInput);
  const store = new LedgerStore(config.ledgerRoot);
  let manifest = readManifest(store, runId);
  if (manifest.state === "running") {
    recoverRun(store, manifest.runId);
    manifest = readManifest(store, manifest.runId);
  }
  const typedRunId = manifest.runId;
  if (manifest.state === "quarantined") throw new Error(`Run ${typedRunId} is quarantined and requires manual review.`);
  if (manifest.state === "cancelled") return manifest;
  if (manifest.state === "rejected") return manifest;
  const graph = store.readJson<import("@toolflow/shared").CompiledGraph>(store.runPath(typedRunId, "compiled-graph.json"));
  const policy = store.readJson<import("@toolflow/shared").PolicyArtifact>(store.runPath(typedRunId, "policy-artifact.json"));
  const ordinaryKey = loadRuntimeKey(store.root);
  const elevatedKey = loadElevatedRuntimeKey(store.root);
  let currentStepId: string | undefined;
  const progress = createRunProgressMonitor(config, graph.nodes.length, () => ({ manifest, currentStepId }));
  manifest.state = "running";
  persistManifest(store, manifest, config);
  progress.start();
  try {
    while (true) {
      const runnable = nextRunnableSteps(graph, manifest);
      if (!runnable.length) break;
      for (const step of runnable) {
        currentStepId = step.id;
        const approval = getStepApproval(store, typedRunId, step.id);
        if (step.cell === "elevated" && !approval) {
          manifest.state = "awaiting_approval";
          manifest.steps[step.id].state = "awaiting_approval";
          persistManifest(store, manifest, config);
          store.appendEvent(typedRunId, "run.approval_required", { stepId: step.id, payloadHash: step.payloadHash, policyHash: policy.policyHash });
          progress.onApprovalWait(step.id, manifest);
          return manifest;
        }
        manifest.steps[step.id].state = "grant_issued";
        const stepKey = step.cell === "elevated" ? elevatedKey : ordinaryKey;
        const grant = mintStepGrant(store, stepKey, typedRunId, step, policy, config.grantTtlSeconds, approval?.approvalHash);
        manifest.steps[step.id].grantId = grant.grantId;
        manifest.steps[step.id].state = "running";
        manifest.steps[step.id].startedAt = nowIso();
        persistManifest(store, manifest, config);
        progress.onStepStarted(step.id, manifest);
        const { receipt, output } = await dispatchStep(store, policy, stepKey, step, grant);
        const outputPath = store.runPath(typedRunId, "artifacts", `${step.id}.output.json`);
        store.writeJson(outputPath, { receiptId: receipt.receiptId, stepId: step.id, status: receipt.status, output });
        manifest.steps[step.id].outputPath = outputPath;
        reconcileReceipt(manifest, receipt);
        store.appendEvent(typedRunId, "step.receipted", { stepId: step.id, receiptId: receipt.receiptId, status: receipt.status });
        if (receipt.status === "failed") {
          manifest.state = "failed";
          persistManifest(store, manifest, config);
          progress.onRunCompleted(manifest);
          return manifest;
        }
        persistManifest(store, manifest, config);
        progress.onStepCompleted(step.id, manifest);
        currentStepId = undefined;
      }
    }
    if (Object.values(manifest.steps).some((step) => step.state === "awaiting_approval")) {
      manifest.state = "awaiting_approval";
      persistManifest(store, manifest, config);
      progress.onRunCompleted(manifest);
      return manifest;
    }
    manifest.state = Object.values(manifest.steps).every((step) => step.state === "succeeded") ? "succeeded" : "failed";
    persistManifest(store, manifest, config);
    store.appendEvent(typedRunId, "run.completed", { state: manifest.state });
    progress.onRunCompleted(manifest);
    return manifest;
  } finally {
    progress.stop();
  }
}

export function approveRunStep(runId: string, stepId: string, approvedBy = "operator", configInput: Partial<RuntimeConfig> = {}): RunManifest {
  const config = resolveConfig(configInput);
  const store = new LedgerStore(config.ledgerRoot);
  const manifest = readManifest(store, runId);
  const typedRunId = manifest.runId;
  const graph = store.readJson<import("@toolflow/shared").CompiledGraph>(store.runPath(typedRunId, "compiled-graph.json"));
  const policy = store.readJson<import("@toolflow/shared").PolicyArtifact>(store.runPath(typedRunId, "policy-artifact.json"));
  const step = graph.nodes.find((node) => node.id === stepId);
  if (!step) throw new Error(`Unknown step "${stepId}".`);
  if (step.cell !== "elevated") throw new Error(`Step "${stepId}" does not require elevated approval.`);
  approveStep(store, typedRunId, step, policy.policyHash, approvedBy);
  manifest.steps[stepId].state = "pending";
  if (manifest.state === "awaiting_approval") manifest.state = "ready";
  persistManifest(store, manifest, config);
  store.appendEvent(typedRunId, "run.approved", { stepId, approvedBy });
  return manifest;
}

export function cancelRun(runId: string, reason = "operator_cancelled", configInput: Partial<RuntimeConfig> = {}): RunManifest {
  const store = createLedger(configInput);
  const manifest = readManifest(store, runId);
  if (["succeeded", "failed", "rejected", "cancelled"].includes(manifest.state)) return manifest;
  for (const step of Object.values(manifest.steps)) {
    if (["pending", "awaiting_approval", "grant_issued", "running"].includes(step.state)) {
      step.state = "cancelled";
      step.error = reason;
    }
  }
  manifest.state = "cancelled";
  persistManifest(store, manifest, configInput);
  store.appendEvent(manifest.runId, "run.cancelled", { reason });
  return manifest;
}

export function getRunReceipts(runId?: string, configInput: Partial<RuntimeConfig> = {}) {
  const store = createLedger(configInput);
  const id = runId ?? store.latestRunId();
  if (!id) throw new Error("No ToolFlow runs found.");
  return { runId: id, receipts: listReceipts(store, id) };
}

export function getRunStatus(runId?: string, configInput: Partial<RuntimeConfig> = {}): RunManifest {
  const store = createLedger(configInput);
  const id = runId ?? store.latestRunId();
  if (!id) throw new Error("No ToolFlow runs found.");
  return readManifest(store, id);
}

export function inspectRun(runId?: string, configInput: Partial<RuntimeConfig> = {}) {
  const store = createLedger(configInput);
  const manifest = getRunStatus(runId, configInput);
  return {
    manifest,
    compiledGraph: store.readJson(store.runPath(manifest.runId, "compiled-graph.json")),
    proofBundle: store.readJson(store.runPath(manifest.runId, "proof-bundle.json")),
    policyArtifact: store.readJson(store.runPath(manifest.runId, "policy-artifact.json"))
  };
}

export function dryRun(workflowPath: string) {
  const config = resolveConfig();
  const { compiledGraph } = compileWorkflowFile(workflowPath);
  const proofBundle = buildProofBundle(compiledGraph, config);
  const policyArtifact = compilePolicyArtifact(compiledGraph, config);
  return { compiledGraph, proofBundle, policyArtifact, summaryHash: hashJson({ graph: compiledGraph.graphHash, proof: proofBundle.proofHash, policy: policyArtifact.policyHash }) };
}

import { PROOF_BUNDLE_SCHEMA_VERSION, hashJson, nowIso } from "@toolflow/shared";
import type { CompiledGraph, ProofBundle } from "@toolflow/shared";
import { inferCapabilities } from "../compiler/infer-capabilities";
import type { RuntimeConfig } from "../config/schema";
import { classifyApprovals } from "./classify-approvals";
import { classifyCapabilities } from "./classify-capabilities";
import { classifyReplay } from "./classify-replay";
import { classifySideEffects } from "./classify-side-effects";
import { classifyStructural } from "./classify-structural";
import { decideOutcome } from "./decide-outcome";
import { estimateCost } from "./estimate-cost";

export function buildProofBundle(graph: CompiledGraph, config: RuntimeConfig): ProofBundle {
  const approvals = classifyApprovals(graph);
  const failures = [...classifyStructural(graph), ...classifyCapabilities(graph, config)];
  const warnings = [...classifyReplay(graph), ...classifySideEffects(graph)];
  const capabilities = inferCapabilities(graph);
  const elevated = capabilities.cells.includes("elevated");
  const withoutHash = {
    schemaVersion: PROOF_BUNDLE_SCHEMA_VERSION,
    workflowName: graph.workflowName,
    graphHash: graph.graphHash,
    decision: decideOutcome(failures, warnings, approvals.requiresApproval),
    riskClass: elevated ? "elevated" as const : "safe" as const,
    requiredCells: capabilities.cells,
    requiredActions: capabilities.actions,
    warnings: [...warnings, ...approvals.notes],
    objectiveFailures: failures,
    estimates: estimateCost(graph),
    createdAt: nowIso()
  };
  return { ...withoutHash, proofHash: hashJson(withoutHash) };
}

import type { Hash } from "../hashing";
import type { SafeActionFamily, SafeCellId } from "./workflow";

export type PreflightDecision = "allow" | "allow_with_warnings" | "requires_approval" | "reject";

export interface ProofBundle {
  schemaVersion: "toolflow.proof-bundle/v1";
  workflowName: string;
  graphHash: Hash;
  decision: PreflightDecision;
  riskClass: "safe" | "elevated";
  requiredCells: SafeCellId[];
  requiredActions: SafeActionFamily[];
  warnings: string[];
  objectiveFailures: string[];
  estimates: {
    stepCount: number;
    latency: "local_fast";
    cost: "none";
  };
  createdAt: string;
  proofHash: Hash;
}

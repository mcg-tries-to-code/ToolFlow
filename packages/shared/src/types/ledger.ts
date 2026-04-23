import type { Hash } from "../hashing";
import type { RunId } from "../ids";
import type { ProofBundle } from "./classifier";
import type { CompiledGraph, CompiledStep, RunState, StepState, WorkflowSource } from "./workflow";

export interface PolicyArtifact {
  schemaVersion: "toolflow.policy-artifact/v1";
  profile: "safe" | "operator-elevated";
  policyHash: Hash;
  allowedCells: CompiledStep["cell"][];
  allowedActionsByCell: Record<CompiledStep["cell"], CompiledStep["action"][]>;
  bridgeMode: "same-process-typed-contracts" | "local-private-typed-contracts";
  bindingNotes: string[];
  createdAt: string;
}

export interface RunManifest {
  schemaVersion: "toolflow.run-manifest/v1";
  runId: RunId;
  workflowName: string;
  state: RunState;
  createdAt: string;
  updatedAt: string;
  workflowHash: Hash;
  graphHash: Hash;
  proofHash: Hash;
  policyHash: Hash;
  steps: Record<string, StepManifest>;
}

export interface StepManifest {
  id: string;
  state: StepState;
  grantId?: string;
  receiptId?: string;
  startedAt?: string;
  endedAt?: string;
  outputPath?: string;
  error?: string;
}

export interface PersistedRunArtifacts {
  workflow: WorkflowSource;
  compiledGraph: CompiledGraph;
  proofBundle: ProofBundle;
  policyArtifact: PolicyArtifact;
}

import { ELEVATED_PROFILE_ACTIONS, POLICY_ARTIFACT_SCHEMA_VERSION, SAFE_PROFILE_ACTIONS, hashJson, nowIso } from "@toolflow/shared";
import type { CompiledGraph, PolicyArtifact } from "@toolflow/shared";
import type { RuntimeConfig } from "../config/schema";

export function compilePolicyArtifact(graph: CompiledGraph, config: RuntimeConfig): PolicyArtifact {
  const elevated = graph.nodes.some((node) => node.cell === "elevated");
  const allowedCells = elevated && config.enableElevated ? ["read", "research", "session", "elevated"] as const : ["read", "research", "session"] as const;
  const allowedActionsByCell: PolicyArtifact["allowedActionsByCell"] = {
    read: ["read_file", "list_files"],
    research: ["research_note"],
    session: ["session_note", "health_downtrend_monitor", "workspace_governance_monthly"],
    elevated: elevated && config.enableElevated ? ["exec_command", "apply_patch"] : []
  };
  const withoutHash = {
    schemaVersion: POLICY_ARTIFACT_SCHEMA_VERSION,
    profile: elevated && config.enableElevated ? "operator-elevated" as const : "safe" as const,
    allowedCells: [...allowedCells],
    allowedActionsByCell,
    bridgeMode: elevated && config.enableElevated ? "local-private-typed-contracts" as const : "same-process-typed-contracts" as const,
    bindingNotes: [
      elevated && config.enableElevated ? "Elevated lane is local-only, approval-bound, and typed." : "Safe Profile MVP permits bridge and cell in one process.",
      "Typed bridge contracts, grant verification, payload hash checks, and receipts remain binding.",
      elevated && config.enableElevated
        ? `Elevated actions require exact-payload approval and remain limited to ${ELEVATED_PROFILE_ACTIONS.join(", ")}.`
        : elevated
          ? "Elevated actions were requested but the elevated lane is disabled in this runtime configuration."
          : `No elevated actions are present; supported actions are ${SAFE_PROFILE_ACTIONS.join(", ")}.`
    ],
    createdAt: nowIso()
  };
  return { ...withoutHash, policyHash: hashJson(withoutHash) };
}

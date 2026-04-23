import type { CompiledGraph } from "@toolflow/shared";

export function classifySideEffects(graph: CompiledGraph): string[] {
  return graph.nodes
    .filter((node) => node.cell === "session")
    .map((node) => node.action === "health_downtrend_monitor"
      ? `Session step "${node.id}" runs the bounded health downtrend monitor.`
      : node.action === "workspace_governance_monthly"
        ? `Session step "${node.id}" runs the bounded workspace governance monthly pass.`
        : `Session step "${node.id}" is constrained to local session semantics.`);
}

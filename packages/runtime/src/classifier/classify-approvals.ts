import type { CompiledGraph } from "@toolflow/shared";

export function classifyApprovals(graph: CompiledGraph): { requiresApproval: boolean; notes: string[] } {
  const elevatedSteps = graph.nodes.filter((node) => node.cell === "elevated");
  if (!elevatedSteps.length) return { requiresApproval: false, notes: [] };
  return {
    requiresApproval: true,
    notes: elevatedSteps.map((step) => `Step "${step.id}" requires exact-payload elevated approval.`)
  };
}

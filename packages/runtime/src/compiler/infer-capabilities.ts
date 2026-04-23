import type { CompiledGraph, SafeActionFamily, SafeCellId } from "@toolflow/shared";

export function inferCapabilities(graph: CompiledGraph): { cells: SafeCellId[]; actions: SafeActionFamily[] } {
  return {
    cells: [...new Set(graph.nodes.map((node) => node.cell))].sort(),
    actions: [...new Set(graph.nodes.map((node) => node.action))].sort()
  };
}

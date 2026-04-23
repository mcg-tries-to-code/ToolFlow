import type { CompiledGraph } from "@toolflow/shared";

export function classifySideEffects(graph: CompiledGraph): string[] {
  return graph.nodes
    .filter((node) => node.cell === "session")
    .map((node) => `Session step "${node.id}" is constrained to local session semantics.`);
}

import type { CompiledGraph } from "@toolflow/shared";

export function estimateCost(graph: CompiledGraph): { stepCount: number; latency: "local_fast"; cost: "none" } {
  return { stepCount: graph.nodes.length, latency: "local_fast", cost: "none" };
}

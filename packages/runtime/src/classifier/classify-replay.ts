import type { CompiledGraph } from "@toolflow/shared";

export function classifyReplay(graph: CompiledGraph): string[] {
  return graph.nodes
    .filter((node) => node.replayClass === "review_before_replay")
    .map((node) => `Step "${node.id}" requires review before replay.`);
}

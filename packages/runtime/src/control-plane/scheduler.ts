import type { CompiledGraph, RunManifest } from "@toolflow/shared";

export function nextRunnableSteps(graph: CompiledGraph, manifest: RunManifest) {
  return graph.nodes.filter((node) => {
    if (manifest.steps[node.id].state !== "pending") return false;
    return node.dependsOn.every((dep) => manifest.steps[dep]?.state === "succeeded");
  });
}

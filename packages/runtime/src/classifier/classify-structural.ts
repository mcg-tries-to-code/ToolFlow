import type { CompiledGraph } from "@toolflow/shared";

export function classifyStructural(graph: CompiledGraph): string[] {
  const failures: string[] = [];
  if (graph.schemaVersion !== "toolflow.compiled-graph/v1") failures.push("Unsupported compiled graph schemaVersion.");
  if (!graph.nodes.length) failures.push("Compiled graph has no executable nodes.");
  return failures;
}

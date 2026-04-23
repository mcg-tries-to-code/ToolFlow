import { TOOLFLOW_ACTIONS, TOOLFLOW_CELLS } from "@toolflow/shared";
import type { CompiledGraph } from "@toolflow/shared";
import type { RuntimeConfig } from "../config/schema";

export function classifyCapabilities(graph: CompiledGraph, config: RuntimeConfig): string[] {
  const failures: string[] = [];
  for (const node of graph.nodes) {
    if (!TOOLFLOW_CELLS.includes(node.cell)) failures.push(`Unsupported cell "${node.cell}" in step "${node.id}".`);
    if (!TOOLFLOW_ACTIONS.includes(node.action)) failures.push(`Unsupported action "${node.action}" in step "${node.id}".`);
    if (node.cell === "elevated" && !config.enableElevated) failures.push(`Elevated lane is disabled for step "${node.id}".`);
  }
  return failures;
}

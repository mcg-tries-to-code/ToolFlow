import { COMPILED_GRAPH_SCHEMA_VERSION, ValidationError, hashJson } from "@toolflow/shared";
import type { CompiledGraph, CompiledStep, WorkflowSource } from "@toolflow/shared";

export function buildGraph(source: WorkflowSource): CompiledGraph {
  const ids = new Set(source.steps.map((step) => step.id));
  for (const step of source.steps) {
    for (const dep of step.dependsOn ?? []) {
      if (!ids.has(dep)) throw new ValidationError(`Step "${step.id}" depends on unknown step "${dep}".`);
    }
  }
  detectCycles(source);
  const sourceHash = hashJson(source);
  const nodes: CompiledStep[] = source.steps.map((step) => {
    const cell = step.cell!;
    const payload = step.args ?? {};
    return { id: step.id, cell, bridgeId: `${cell}-bridge-v1`, action: step.action, dependsOn: step.dependsOn ?? [], payload, payloadHash: hashJson(payload), replayClass: step.replayClass ?? "idempotent" };
  });
  const graphWithoutHash = { schemaVersion: COMPILED_GRAPH_SCHEMA_VERSION, workflowName: source.name, sourceHash, nodes };
  return { ...graphWithoutHash, graphHash: hashJson(graphWithoutHash) };
}

function detectCycles(source: WorkflowSource): void {
  const deps = new Map(source.steps.map((step) => [step.id, step.dependsOn ?? []]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): void => {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new ValidationError(`Dependency cycle detected at "${id}".`);
    visiting.add(id);
    for (const dep of deps.get(id) ?? []) visit(dep);
    visiting.delete(id);
    visited.add(id);
  };
  for (const step of source.steps) visit(step.id);
}

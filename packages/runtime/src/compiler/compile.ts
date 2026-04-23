import type { CompileResult, WorkflowSource } from "@toolflow/shared";
import { buildGraph } from "./build-graph";
import { normalizeWorkflow } from "./normalize-workflow";
import { parseWorkflowFile } from "./parse-workflow";
import { resolveVariables } from "./resolve-variables";

export function compileWorkflowFile(path: string): CompileResult {
  return compileWorkflow(parseWorkflowFile(path));
}

export function compileWorkflow(source: WorkflowSource): CompileResult {
  const normalized = normalizeWorkflow(source);
  const resolved = resolveVariables(normalized);
  return { source: resolved, compiledGraph: buildGraph(resolved) };
}

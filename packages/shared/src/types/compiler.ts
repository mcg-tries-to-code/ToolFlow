import type { CompiledGraph, WorkflowSource } from "./workflow";

export interface CompileResult {
  source: WorkflowSource;
  compiledGraph: CompiledGraph;
}

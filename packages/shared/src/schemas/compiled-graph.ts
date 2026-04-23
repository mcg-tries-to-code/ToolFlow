import type { CompiledGraph } from "../types/workflow";
import { hasArray, hasString, isRecord } from "./helpers";

export function isCompiledGraph(value: unknown): value is CompiledGraph {
  return isRecord(value) && value.schemaVersion === "toolflow.compiled-graph/v1" && hasString(value, "workflowName") && hasString(value, "graphHash") && hasArray(value, "nodes");
}

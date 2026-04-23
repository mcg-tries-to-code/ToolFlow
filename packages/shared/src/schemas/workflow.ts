import type { WorkflowSource } from "../types/workflow";
import { isRecord, hasArray, hasString } from "./helpers";

export function isWorkflowSource(value: unknown): value is WorkflowSource {
  return isRecord(value) && value.schemaVersion === "toolflow.workflow/v1" && hasString(value, "name") && hasArray(value, "steps");
}

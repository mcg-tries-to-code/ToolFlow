import { readFileSync } from "node:fs";
import { ValidationError } from "@toolflow/shared";
import type { WorkflowSource } from "@toolflow/shared";

export function parseWorkflowFile(path: string): WorkflowSource {
  if (!path.endsWith(".json")) throw new ValidationError("Safe Profile MVP accepts JSON workflow files only.");
  return parseWorkflowJson(readFileSync(path, "utf8"));
}

export function parseWorkflowJson(raw: string): WorkflowSource {
  try {
    return JSON.parse(raw) as WorkflowSource;
  } catch (error) {
    throw new ValidationError(`Workflow JSON parse failed: ${(error as Error).message}`);
  }
}

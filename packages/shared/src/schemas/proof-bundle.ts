import type { ProofBundle } from "../types/classifier";
import { hasArray, hasObject, hasString, isRecord } from "./helpers";

export function isProofBundle(value: unknown): value is ProofBundle {
  return isRecord(value) && value.schemaVersion === "toolflow.proof-bundle/v1" && hasString(value, "workflowName") && hasArray(value, "warnings") && hasArray(value, "objectiveFailures") && hasObject(value, "estimates");
}

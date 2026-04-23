import type { StepGrant } from "../types/grants";
import { hasString, isRecord } from "./helpers";

export function isStepGrant(value: unknown): value is StepGrant {
  return isRecord(value) && value.schemaVersion === "toolflow.step-grant/v1" && hasString(value, "grantId") && hasString(value, "runId") && hasString(value, "signature");
}

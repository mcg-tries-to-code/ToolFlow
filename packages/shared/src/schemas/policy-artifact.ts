import type { PolicyArtifact } from "../types/ledger";
import { hasArray, hasString, isRecord } from "./helpers";

export function isPolicyArtifact(value: unknown): value is PolicyArtifact {
  return isRecord(value) && value.schemaVersion === "toolflow.policy-artifact/v1" && hasString(value, "policyHash") && hasArray(value, "allowedCells") && hasString(value, "bridgeMode");
}

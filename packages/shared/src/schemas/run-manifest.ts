import type { RunManifest } from "../types/ledger";
import { hasObject, hasString, isRecord } from "./helpers";

export function isRunManifest(value: unknown): value is RunManifest {
  return isRecord(value) && value.schemaVersion === "toolflow.run-manifest/v1" && hasString(value, "runId") && hasString(value, "workflowName") && hasObject(value, "steps");
}

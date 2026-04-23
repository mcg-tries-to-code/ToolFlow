export interface CheckpointRecord {
  runId: string;
  stepId: string;
  at: string;
  state: string;
}

export function isCheckpointRecord(value: unknown): value is CheckpointRecord {
  return typeof value === "object" && value !== null
    && typeof (value as Record<string, unknown>).runId === "string"
    && typeof (value as Record<string, unknown>).stepId === "string"
    && typeof (value as Record<string, unknown>).at === "string"
    && typeof (value as Record<string, unknown>).state === "string";
}

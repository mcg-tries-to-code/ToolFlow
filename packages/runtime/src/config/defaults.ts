import type { RuntimeConfig } from "./schema";

export const DEFAULT_CONFIG: RuntimeConfig = {
  ledgerRoot: "data/ledger",
  taskflowMirrorRoot: "data/taskflow-mirror",
  grantTtlSeconds: 300,
  enableElevated: false,
  elevatedAllowedCommands: [],
  progressUpdates: {
    enabled: false,
    longRunThresholdMs: 5 * 60 * 1000,
    intervalMs: 5 * 60 * 1000,
    sink: "stderr"
  }
};

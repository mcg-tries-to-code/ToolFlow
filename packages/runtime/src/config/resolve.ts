import { resolve } from "node:path";
import { DEFAULT_CONFIG } from "./defaults";
import type { RuntimeConfig } from "./schema";

export function resolveConfig(overrides: Partial<RuntimeConfig> = {}): RuntimeConfig {
  const enableElevated = overrides.enableElevated ?? (process.env.TOOLFLOW_ENABLE_ELEVATED === "1");
  const elevatedAllowedCommands = overrides.elevatedAllowedCommands
    ?? process.env.TOOLFLOW_ELEVATED_ALLOW?.split(",").map((value) => value.trim()).filter(Boolean)
    ?? DEFAULT_CONFIG.elevatedAllowedCommands;
  const defaultProgress = DEFAULT_CONFIG.progressUpdates;
  const envProgressEnabled = process.env.TOOLFLOW_PROGRESS_ENABLED === "1";
  const envProgressAfterSeconds = Number(process.env.TOOLFLOW_PROGRESS_AFTER_SECONDS ?? "");
  const envProgressIntervalSeconds = Number(process.env.TOOLFLOW_PROGRESS_INTERVAL_SECONDS ?? "");
  const progressUpdates = {
    ...defaultProgress,
    ...overrides.progressUpdates,
    enabled: overrides.progressUpdates?.enabled ?? envProgressEnabled ?? defaultProgress.enabled,
    longRunThresholdMs: overrides.progressUpdates?.longRunThresholdMs
      ?? (Number.isFinite(envProgressAfterSeconds) && envProgressAfterSeconds >= 0 ? envProgressAfterSeconds * 1000 : defaultProgress.longRunThresholdMs),
    intervalMs: overrides.progressUpdates?.intervalMs
      ?? (Number.isFinite(envProgressIntervalSeconds) && envProgressIntervalSeconds >= 0 ? envProgressIntervalSeconds * 1000 : defaultProgress.intervalMs),
    sink: overrides.progressUpdates?.sink
      ?? ((process.env.TOOLFLOW_PROGRESS_SINK === "command" || process.env.TOOLFLOW_PROGRESS_SINK === "stderr") ? process.env.TOOLFLOW_PROGRESS_SINK : defaultProgress.sink),
    command: overrides.progressUpdates?.command ?? process.env.TOOLFLOW_PROGRESS_COMMAND ?? defaultProgress.command
  };
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    ledgerRoot: resolve(overrides.ledgerRoot ?? process.env.TOOLFLOW_LEDGER_DIR ?? DEFAULT_CONFIG.ledgerRoot),
    taskflowMirrorRoot: resolve(overrides.taskflowMirrorRoot ?? process.env.TOOLFLOW_TASKFLOW_MIRROR_DIR ?? DEFAULT_CONFIG.taskflowMirrorRoot),
    enableElevated,
    elevatedAllowedCommands,
    progressUpdates
  };
}

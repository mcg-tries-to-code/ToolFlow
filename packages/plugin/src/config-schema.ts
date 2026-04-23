export interface ToolflowPluginProgressConfig {
  enabled?: boolean;
  longRunThresholdMs?: number;
  intervalMs?: number;
  sink?: "stderr" | "command";
  command?: string;
}

export interface ToolflowPluginConfig {
  ledgerRoot?: string;
  taskflowMirrorRoot?: string;
  enableElevated?: boolean;
  elevatedAllowedCommands?: string[];
  progressUpdates?: ToolflowPluginProgressConfig;
}

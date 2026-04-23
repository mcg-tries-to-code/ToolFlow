import type { ToolflowPluginConfig } from "./config-schema";

export function resolvePluginRuntimeStore(config: ToolflowPluginConfig = {}): { ledgerRoot: string } {
  return { ledgerRoot: config.ledgerRoot ?? process.env.TOOLFLOW_LEDGER_DIR ?? "data/ledger" };
}

import { resolvePluginRuntimeStore } from "../runtime-store";
import type { ToolflowPluginConfig } from "../config-schema";

export function runtimeSupervisorStatus(config: ToolflowPluginConfig = {}) {
  return {
    ok: true,
    mode: "in-process",
    store: resolvePluginRuntimeStore(config)
  };
}

import type { ElevatedConfig } from "./schema";

export function resolveElevatedConfig(): ElevatedConfig {
  return {
    allowedCommands: process.env.TOOLFLOW_ELEVATED_ALLOW?.split(",").map((value) => value.trim()).filter(Boolean) ?? []
  };
}

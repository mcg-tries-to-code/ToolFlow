import type { BridgeHandler } from "@toolflow/shared";
import { runElevatedCell } from "../cell/runner";

export const elevatedBridgeHandler: BridgeHandler = {
  bridgeId: "elevated-bridge-v1",
  cellId: "elevated",
  actions: ["exec_command", "apply_patch"],
  execute: runElevatedCell
};

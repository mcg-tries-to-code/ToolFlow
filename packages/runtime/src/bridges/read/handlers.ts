import type { BridgeHandler } from "@toolflow/shared";
import { runReadCell } from "../../cells/read/runner";

export const readBridgeHandler: BridgeHandler = {
  bridgeId: "read-bridge-v1",
  cellId: "read",
  actions: ["read_file", "list_files"],
  execute: runReadCell
};

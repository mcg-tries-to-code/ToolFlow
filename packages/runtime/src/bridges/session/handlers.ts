import type { BridgeHandler } from "@toolflow/shared";
import { runSessionCell } from "../../cells/session/runner";

export const sessionBridgeHandler: BridgeHandler = {
  bridgeId: "session-bridge-v1",
  cellId: "session",
  actions: ["session_note"],
  execute: runSessionCell
};

import type { BridgeHandler } from "@toolflow/shared";
import { runResearchCell } from "../../cells/research/runner";

export const researchBridgeHandler: BridgeHandler = {
  bridgeId: "research-bridge-v1",
  cellId: "research",
  actions: ["research_note"],
  execute: runResearchCell
};

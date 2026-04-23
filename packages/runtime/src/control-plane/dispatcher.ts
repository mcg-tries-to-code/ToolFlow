import type { BridgeHandler, BridgeRequest, CompiledStep, PolicyArtifact, Receipt, StepGrant } from "@toolflow/shared";
import { ElevatedBridge, elevatedBridgeHandler } from "../../../elevated/dist/main";
import type { RuntimeKey } from "../crypto/keyring";
import type { LedgerStore } from "../ledger/store";
import { SameProcessBridge } from "../bridges/base/bridge-server";
import { readBridgeHandler } from "../bridges/read/handlers";
import { researchBridgeHandler } from "../bridges/research/handlers";
import { sessionBridgeHandler } from "../bridges/session/handlers";

const handlers: Record<string, BridgeHandler> = {
  elevated: elevatedBridgeHandler,
  read: readBridgeHandler,
  research: researchBridgeHandler,
  session: sessionBridgeHandler
};

export async function dispatchStep(store: LedgerStore, policy: PolicyArtifact, key: RuntimeKey, step: CompiledStep, grant: StepGrant): Promise<{ receipt: Receipt; output?: Record<string, unknown> }> {
  const handler = handlers[step.cell];
  const bridge = step.cell === "elevated" ? new ElevatedBridge(handler, store, policy, key) : new SameProcessBridge(handler, store, policy, key);
  const request: BridgeRequest = { bridgeId: step.bridgeId, cellId: step.cell, action: step.action, payload: step.payload, grant };
  return bridge.execute(request);
}

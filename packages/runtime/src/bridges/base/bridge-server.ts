import type { BridgeHandler, BridgeRequest, PolicyArtifact, Receipt } from "@toolflow/shared";
import { nowIso } from "@toolflow/shared";
import type { RuntimeKey } from "../../crypto/keyring";
import { consumeGrant } from "../../ledger/grants";
import { writeReceipt } from "../../ledger/receipts";
import type { LedgerStore } from "../../ledger/store";
import { emitReceipt } from "./emit-receipt";
import { verifyGrantForRequest } from "./verify-grant";

export class SameProcessBridge {
  constructor(
    private readonly handler: BridgeHandler,
    private readonly store: LedgerStore,
    private readonly policy: PolicyArtifact,
    private readonly key: RuntimeKey
  ) {}

  async execute(request: BridgeRequest): Promise<{ receipt: Receipt; output?: Record<string, unknown> }> {
    const startedAt = nowIso();
    verifyGrantForRequest(this.store, this.policy, this.key, request);
    const result = await this.handler.execute(request);
    const receipt = emitReceipt(request, result, this.key, startedAt);
    writeReceipt(this.store, receipt);
    consumeGrant(this.store, receipt.runId, receipt.grantId, receipt.receiptId);
    return { receipt, output: result.output };
  }
}

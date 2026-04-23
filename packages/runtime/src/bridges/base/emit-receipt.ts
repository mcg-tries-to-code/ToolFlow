import { RECEIPT_SCHEMA_VERSION, hashJson, newReceiptId, nowIso } from "@toolflow/shared";
import type { BridgeExecutionResult, BridgeRequest, Receipt } from "@toolflow/shared";
import type { RuntimeKey } from "../../crypto/keyring";
import { signObject } from "../../crypto/signer";

export function emitReceipt(request: BridgeRequest, result: BridgeExecutionResult, key: RuntimeKey, startedAt: string): Receipt {
  const withoutSignature = {
    schemaVersion: RECEIPT_SCHEMA_VERSION,
    receiptId: newReceiptId(),
    grantId: request.grant.grantId,
    runId: request.grant.runId,
    stepId: request.grant.stepId,
    bridgeId: request.bridgeId,
    payloadHash: request.grant.payloadHash,
    policyHash: request.grant.policyHash,
    status: result.ok ? "succeeded" as const : "failed" as const,
    startedAt,
    endedAt: nowIso(),
    outputHash: result.output ? hashJson(result.output) : undefined,
    error: result.error,
    keyId: key.keyId
  };
  return { ...withoutSignature, signature: signObject(withoutSignature as unknown as Record<string, unknown>, key) };
}

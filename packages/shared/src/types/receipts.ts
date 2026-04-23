import type { Hash } from "../hashing";
import type { GrantId, ReceiptId, RunId } from "../ids";
import type { SafeCellId } from "./workflow";

export interface ReceiptUnsigned {
  schemaVersion: "toolflow.receipt/v1";
  receiptId: ReceiptId;
  grantId: GrantId;
  runId: RunId;
  stepId: string;
  bridgeId: `${SafeCellId}-bridge-v1`;
  payloadHash: Hash;
  policyHash: Hash;
  status: "succeeded" | "failed";
  startedAt: string;
  endedAt: string;
  outputHash?: Hash;
  error?: string;
  keyId: string;
}

export interface Receipt extends ReceiptUnsigned {
  signature: string;
}

import type { Hash } from "../hashing";
import type { GrantId, RunId } from "../ids";
import type { ReplayClass, SafeActionFamily, SafeCellId } from "./workflow";

export interface StepGrantUnsigned {
  schemaVersion: "toolflow.step-grant/v1";
  grantId: GrantId;
  runId: RunId;
  stepId: string;
  cellId: SafeCellId;
  bridgeId: `${SafeCellId}-bridge-v1`;
  action: SafeActionFamily;
  payloadHash: Hash;
  policyHash: Hash;
  approvalHash?: Hash;
  replayClass: ReplayClass;
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  keyId: string;
}

export interface StepGrant extends StepGrantUnsigned {
  signature: string;
}

export interface GrantRecord {
  grant: StepGrant;
  state: "issued" | "consumed" | "expired" | "void";
  consumedAt?: string;
  receiptId?: string;
}

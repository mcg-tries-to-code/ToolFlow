import { STEP_GRANT_SCHEMA_VERSION, newGrantId, secondsFromNow } from "@toolflow/shared";
import type { CompiledStep, GrantRecord, Hash, PolicyArtifact, RunId, StepGrant } from "@toolflow/shared";
import { randomBytes } from "node:crypto";
import type { RuntimeKey } from "../crypto/keyring";
import { signObject } from "../crypto/signer";
import { writeGrant } from "../ledger/grants";
import type { LedgerStore } from "../ledger/store";

export function mintStepGrant(store: LedgerStore, key: RuntimeKey, runId: RunId, step: CompiledStep, policy: PolicyArtifact, ttlSeconds: number, approvalHash?: Hash): StepGrant {
  const unsigned = {
    schemaVersion: STEP_GRANT_SCHEMA_VERSION,
    grantId: newGrantId(),
    runId,
    stepId: step.id,
    cellId: step.cell,
    bridgeId: step.bridgeId,
    action: step.action,
    payloadHash: step.payloadHash,
    policyHash: policy.policyHash,
    approvalHash,
    replayClass: step.replayClass,
    issuedAt: new Date().toISOString(),
    expiresAt: secondsFromNow(ttlSeconds),
    nonce: randomBytes(12).toString("hex"),
    keyId: key.keyId
  };
  const grant: StepGrant = { ...unsigned, signature: signObject(unsigned as unknown as Record<string, unknown>, key) };
  const record: GrantRecord = { grant, state: "issued" };
  writeGrant(store, runId, record);
  return grant;
}

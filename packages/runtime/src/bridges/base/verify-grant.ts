import { PolicyError, hashJson, isExpired } from "@toolflow/shared";
import type { BridgeRequest, PolicyArtifact } from "@toolflow/shared";
import type { RuntimeKey } from "../../crypto/keyring";
import { verifyObject } from "../../crypto/verifier";
import { readGrant } from "../../ledger/grants";
import type { LedgerStore } from "../../ledger/store";

export function verifyGrantForRequest(store: LedgerStore, policy: PolicyArtifact, key: RuntimeKey, request: BridgeRequest): void {
  const { grant } = request;
  const { signature, ...unsigned } = grant;
  if (!verifyObject(unsigned as unknown as Record<string, unknown>, signature, key)) throw new PolicyError("Grant signature verification failed.");
  if (isExpired(grant.expiresAt)) throw new PolicyError("Grant is expired.");
  if (grant.bridgeId !== request.bridgeId || grant.cellId !== request.cellId) throw new PolicyError("Grant bridge or cell binding mismatch.");
  if (grant.action !== request.action) throw new PolicyError("Grant action binding mismatch.");
  if (grant.payloadHash !== hashJson(request.payload)) throw new PolicyError("Grant payload hash mismatch.");
  if (grant.policyHash !== policy.policyHash) throw new PolicyError("Grant policy hash mismatch.");
  const record = readGrant(store, grant.runId, grant.grantId);
  if (record.state !== "issued") throw new PolicyError(`Grant is ${record.state}, not issued.`);
}

import { createHmac, timingSafeEqual } from "node:crypto";
import type { ApprovalBinding, BridgeExecutionResult, BridgeHandler, BridgeRequest, PolicyArtifact, Receipt } from "@toolflow/shared";
import { RECEIPT_SCHEMA_VERSION, canonicalJson, hashJson, isExpired, nowIso, newReceiptId, PolicyError } from "@toolflow/shared";
import { ensureLocalTransport } from "./local-transport-guard";
import { ensureApprovalForElevatedRequest } from "./verify-approval";

export interface RuntimeKey {
  keyId: string;
  secret: string;
}

export interface LedgerLike {
  runPath(runId: string, ...parts: string[]): string;
  writeJson(path: string, value: unknown): void;
  readJson<T>(path: string): T;
}

export class ElevatedBridge {
  constructor(
    private readonly handler: BridgeHandler,
    private readonly store: LedgerLike,
    private readonly policy: PolicyArtifact,
    private readonly key: RuntimeKey
  ) {}

  async execute(request: BridgeRequest): Promise<{ receipt: Receipt; output?: Record<string, unknown> }> {
    const startedAt = nowIso();
    verifyGrantForRequest(this.store, this.policy, this.key, request);
    ensureLocalTransport(request);
    const approval = readApproval(this.store, request.grant.runId, request.grant.stepId);
    ensureApprovalForElevatedRequest(request, approval);
    const result = await this.handler.execute(request);
    const receipt = emitReceipt(request, result, this.key, startedAt);
    writeReceipt(this.store, receipt);
    consumeGrant(this.store, receipt.runId, receipt.grantId, receipt.receiptId);
    return { receipt, output: result.output };
  }
}

function signObject(value: Record<string, unknown>, key: RuntimeKey): string {
  return createHmac("sha256", key.secret).update(canonicalJson(value)).digest("hex");
}

function verifyObject(value: Record<string, unknown>, signature: string, key: RuntimeKey): boolean {
  const expected = Buffer.from(signObject(value, key), "hex");
  const actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function verifyGrantForRequest(store: LedgerLike, policy: PolicyArtifact, key: RuntimeKey, request: BridgeRequest): void {
  const { grant } = request;
  const { signature, ...unsigned } = grant;
  if (!verifyObject(unsigned as unknown as Record<string, unknown>, signature, key)) throw new PolicyError("Grant signature verification failed.");
  if (isExpired(grant.expiresAt)) throw new PolicyError("Grant is expired.");
  if (grant.bridgeId !== request.bridgeId || grant.cellId !== request.cellId) throw new PolicyError("Grant bridge or cell binding mismatch.");
  if (grant.action !== request.action) throw new PolicyError("Grant action binding mismatch.");
  if (grant.payloadHash !== hashJson(request.payload)) throw new PolicyError("Grant payload hash mismatch.");
  if (grant.policyHash !== policy.policyHash) throw new PolicyError("Grant policy hash mismatch.");
  const record = store.readJson<{ state: string }>(store.runPath(grant.runId, "grants", `${grant.grantId}.json`));
  if (record.state !== "issued") throw new PolicyError(`Grant is ${record.state}, not issued.`);
}

function emitReceipt(request: BridgeRequest, result: BridgeExecutionResult, key: RuntimeKey, startedAt: string): Receipt {
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

function writeReceipt(store: LedgerLike, receipt: Receipt): void {
  store.writeJson(store.runPath(receipt.runId, "receipts", `${receipt.receiptId}.json`), receipt);
}

function consumeGrant(store: LedgerLike, runId: string, grantId: string, receiptId: string): void {
  const record = store.readJson<Record<string, unknown>>(store.runPath(runId, "grants", `${grantId}.json`));
  record.state = "consumed";
  record.consumedAt = nowIso();
  record.receiptId = receiptId;
  store.writeJson(store.runPath(runId, "grants", `${grantId}.json`), record);
}

function readApproval(store: LedgerLike, runId: string, stepId: string): ApprovalBinding | undefined {
  try {
    return store.readJson<ApprovalBinding>(store.runPath(runId, "approvals", `${stepId}.json`));
  } catch {
    return undefined;
  }
}

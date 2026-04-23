import type { GrantRecord } from "@toolflow/shared";
import { nowIso } from "@toolflow/shared";
import type { LedgerStore } from "./store";

export function writeGrant(store: LedgerStore, runId: string, record: GrantRecord): void {
  store.writeJson(store.runPath(runId, "grants", `${record.grant.grantId}.json`), record);
}

export function readGrant(store: LedgerStore, runId: string, grantId: string): GrantRecord {
  return store.readJson<GrantRecord>(store.runPath(runId, "grants", `${grantId}.json`));
}

export function consumeGrant(store: LedgerStore, runId: string, grantId: string, receiptId: string): void {
  const record = readGrant(store, runId, grantId);
  record.state = "consumed";
  record.consumedAt = nowIso();
  record.receiptId = receiptId;
  writeGrant(store, runId, record);
}

export function expireGrant(store: LedgerStore, runId: string, grantId: string): void {
  const record = readGrant(store, runId, grantId);
  record.state = "expired";
  writeGrant(store, runId, record);
}

export function voidGrant(store: LedgerStore, runId: string, grantId: string): void {
  const record = readGrant(store, runId, grantId);
  record.state = "void";
  writeGrant(store, runId, record);
}

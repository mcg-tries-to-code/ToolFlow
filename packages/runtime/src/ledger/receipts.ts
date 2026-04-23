import type { Receipt } from "@toolflow/shared";
import type { LedgerStore } from "./store";

export function writeReceipt(store: LedgerStore, receipt: Receipt): void {
  store.writeJson(store.runPath(receipt.runId, "receipts", `${receipt.receiptId}.json`), receipt);
}

export function readReceipt(store: LedgerStore, runId: string, receiptId: string): Receipt {
  return store.readJson<Receipt>(store.runPath(runId, "receipts", `${receiptId}.json`));
}

export function tryReadReceipt(store: LedgerStore, runId: string, receiptId?: string): Receipt | undefined {
  if (!receiptId) return undefined;
  try {
    return readReceipt(store, runId, receiptId);
  } catch {
    return undefined;
  }
}

export function listReceipts(store: LedgerStore, runId: string): Receipt[] {
  return store.listJsonFiles(store.runPath(runId, "receipts")).map((path) => store.readJson<Receipt>(path));
}

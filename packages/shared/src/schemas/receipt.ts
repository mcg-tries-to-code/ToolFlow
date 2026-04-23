import type { Receipt } from "../types/receipts";
import { hasString, isRecord } from "./helpers";

export function isReceipt(value: unknown): value is Receipt {
  return isRecord(value) && value.schemaVersion === "toolflow.receipt/v1" && hasString(value, "receiptId") && hasString(value, "grantId") && hasString(value, "signature");
}

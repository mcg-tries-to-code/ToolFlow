import type { Receipt, RunManifest } from "@toolflow/shared";

export function reconcileReceipt(manifest: RunManifest, receipt: Receipt): void {
  const step = manifest.steps[receipt.stepId];
  step.state = receipt.status;
  step.receiptId = receipt.receiptId;
  step.endedAt = receipt.endedAt;
  if (receipt.error) step.error = receipt.error;
}

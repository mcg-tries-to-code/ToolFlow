import { PolicyError } from "@toolflow/shared";
import type { BridgeRequest } from "@toolflow/shared";

export function ensureLocalTransport(request: BridgeRequest): void {
  const localOnly = request.payload.localOnly;
  if (localOnly === false) throw new PolicyError("Elevated bridge rejects non-local transport requests.");
}

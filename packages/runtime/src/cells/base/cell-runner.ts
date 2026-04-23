import type { BridgeExecutionResult, BridgeRequest } from "@toolflow/shared";

export interface CellRunner {
  execute(request: BridgeRequest): Promise<BridgeExecutionResult>;
}

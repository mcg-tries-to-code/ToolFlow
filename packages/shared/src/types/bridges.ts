import type { StepGrant } from "./grants";
import type { SafeActionFamily, SafeCellId } from "./workflow";

export interface BridgeRequest {
  bridgeId: `${SafeCellId}-bridge-v1`;
  cellId: SafeCellId;
  action: SafeActionFamily;
  payload: Record<string, unknown>;
  grant: StepGrant;
}

export interface BridgeExecutionResult {
  ok: boolean;
  output?: Record<string, unknown>;
  error?: string;
}

export interface BridgeHandler {
  bridgeId: `${SafeCellId}-bridge-v1`;
  cellId: SafeCellId;
  actions: readonly SafeActionFamily[];
  execute(request: BridgeRequest): Promise<BridgeExecutionResult>;
}

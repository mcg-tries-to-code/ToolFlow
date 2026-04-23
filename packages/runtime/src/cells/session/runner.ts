import type { BridgeExecutionResult, BridgeRequest } from "@toolflow/shared";

export async function runSessionCell(request: BridgeRequest): Promise<BridgeExecutionResult> {
  if (request.action === "session_note") {
    const prompt = typeof request.payload.prompt === "string" ? request.payload.prompt : "";
    return { ok: true, output: { mode: "local_session_note", prompt, response: `MVP session note recorded: ${prompt}` } };
  }
  return { ok: false, error: `Unsupported session action ${request.action}.` };
}

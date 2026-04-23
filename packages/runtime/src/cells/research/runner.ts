import type { BridgeExecutionResult, BridgeRequest } from "@toolflow/shared";

export async function runResearchCell(request: BridgeRequest): Promise<BridgeExecutionResult> {
  if (request.action !== "research_note") return { ok: false, error: `Unsupported research action ${request.action}.` };
  const query = typeof request.payload.query === "string" ? request.payload.query : "unspecified";
  const sources = Array.isArray(request.payload.sources) ? request.payload.sources.map(String) : [];
  const note = `Local research note for "${query}". Sources considered: ${sources.length ? sources.join(", ") : "none provided"}.`;
  return { ok: true, output: { query, sources, note } };
}

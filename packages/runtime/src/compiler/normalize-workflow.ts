import { SAFE_PROFILE_ACTIONS, TOOLFLOW_ACTIONS, TOOLFLOW_CELLS, ValidationError, normalizeStepId } from "@toolflow/shared";
import type { SafeActionFamily, SafeCellId, WorkflowSource, WorkflowStepSource } from "@toolflow/shared";

export function normalizeWorkflow(source: WorkflowSource): WorkflowSource {
  if (source.schemaVersion !== "toolflow.workflow/v1") throw new ValidationError("Unsupported workflow schemaVersion.");
  if (!source.name || typeof source.name !== "string") throw new ValidationError("Workflow name is required.");
  if (!Array.isArray(source.steps) || source.steps.length === 0) throw new ValidationError("Workflow must include at least one step.");
  const seen = new Set<string>();
  return { ...source, steps: source.steps.map((step) => normalizeStep(step, seen)) };
}

function normalizeStep(step: WorkflowStepSource, seen: Set<string>): WorkflowStepSource {
  const id = normalizeStepId(step.id);
  if (seen.has(id)) throw new ValidationError(`Duplicate step id "${id}".`);
  seen.add(id);
  if (!TOOLFLOW_ACTIONS.includes(step.action as SafeActionFamily)) throw new ValidationError(`Action "${String(step.action)}" is not supported by ToolFlow.`);
  const cell = step.cell ?? inferCell(step.action);
  if (!TOOLFLOW_CELLS.includes(cell as SafeCellId)) throw new ValidationError(`Cell "${String(cell)}" is not supported by ToolFlow.`);
  const replayClass = step.replayClass ?? (cell === "read" ? "read_only" : cell === "elevated" ? "review_before_replay" : "idempotent");
  return { id, action: step.action, cell, dependsOn: step.dependsOn ?? [], args: step.args ?? {}, replayClass };
}

export function inferCell(action: SafeActionFamily): SafeCellId {
  if (action === "read_file" || action === "list_files") return "read";
  if (action === "research_note") return "research";
  if (action === "session_note" || action === "health_downtrend_monitor" || action === "workspace_governance_monthly") return "session";
  return "elevated";
}

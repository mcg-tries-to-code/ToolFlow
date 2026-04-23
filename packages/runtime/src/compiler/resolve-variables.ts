import { ValidationError } from "@toolflow/shared";
import type { WorkflowSource } from "@toolflow/shared";

export function resolveVariables(source: WorkflowSource): WorkflowSource {
  const inputs = source.inputs ?? {};
  return { ...source, steps: source.steps.map((step) => ({ ...step, args: resolveValue(step.args ?? {}, inputs) as Record<string, unknown> })) };
}

function resolveValue(value: unknown, inputs: Record<string, string | number | boolean>): unknown {
  if (typeof value === "string") {
    return value.replace(/\$\{inputs\.([A-Za-z0-9_-]+)\}/g, (_match, key: string) => {
      if (!(key in inputs)) throw new ValidationError(`Unresolved input reference "${key}".`);
      return String(inputs[key]);
    });
  }
  if (Array.isArray(value)) return value.map((entry) => resolveValue(entry, inputs));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, resolveValue(entry, inputs)]));
  return value;
}

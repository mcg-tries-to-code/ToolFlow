import type { CompiledStep, PolicyArtifact } from "@toolflow/shared";

export function evaluateStepPolicy(step: CompiledStep, policy: PolicyArtifact): string | undefined {
  const allowed = policy.allowedActionsByCell[step.cell] ?? [];
  if (!allowed.includes(step.action)) return `Action "${step.action}" is not allowed for cell "${step.cell}".`;
  return undefined;
}

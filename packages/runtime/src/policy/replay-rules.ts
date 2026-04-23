import type { ReplayClass, ReplayDecision } from "@toolflow/shared";

export function replayDecision(replayClass: ReplayClass): ReplayDecision {
  if (replayClass === "review_before_replay") return "review_required";
  return "replay_allowed";
}

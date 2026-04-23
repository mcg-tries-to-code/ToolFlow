import { spawn } from "node:child_process";
import { nowIso } from "@toolflow/shared";
import type { RunManifest } from "@toolflow/shared";
import type { RuntimeConfig, RuntimeProgressEvent } from "../config/schema";

interface Snapshot {
  manifest: RunManifest;
  currentStepId?: string;
}

export interface RunProgressMonitor {
  start(): void;
  stop(): void;
  onStepStarted(stepId: string, manifest: RunManifest): void;
  onStepCompleted(stepId: string, manifest: RunManifest): void;
  onApprovalWait(stepId: string, manifest: RunManifest): void;
  onRunCompleted(manifest: RunManifest): void;
}

export function createRunProgressMonitor(config: RuntimeConfig, totalSteps: number, getSnapshot: () => Snapshot): RunProgressMonitor {
  const reporter = config.progressReporter ?? defaultReporter(config);
  const progress = config.progressUpdates;
  if (!progress.enabled && !config.progressReporter) return silentMonitor();

  let interval: NodeJS.Timeout | undefined;
  let longRunningStarted = false;
  let lastLongRunningAt = 0;

  function elapsedMs(manifest: RunManifest): number {
    return Math.max(0, Date.now() - new Date(manifest.createdAt).getTime());
  }

  function completedSteps(manifest: RunManifest): number {
    return Object.values(manifest.steps).filter((step) => step.state === "succeeded").length;
  }

  function emit(type: RuntimeProgressEvent["type"], manifest: RunManifest, message: string, currentStepId?: string): void {
    void Promise.resolve(reporter({
      type,
      runId: manifest.runId,
      workflowName: manifest.workflowName,
      state: manifest.state,
      elapsedMs: elapsedMs(manifest),
      completedSteps: completedSteps(manifest),
      totalSteps,
      currentStepId,
      message,
      emittedAt: nowIso()
    })).catch(() => undefined);
  }

  function maybeEmitLongRunning(snapshot: Snapshot, force = false): void {
    const threshold = progress.longRunThresholdMs;
    const intervalMs = Math.max(progress.intervalMs, 1_000);
    const elapsed = elapsedMs(snapshot.manifest);
    if (!force && elapsed < threshold) return;
    const now = Date.now();
    if (!force && longRunningStarted && now - lastLongRunningAt < intervalMs) return;
    longRunningStarted = true;
    lastLongRunningAt = now;
    const stepText = snapshot.currentStepId ? ` Current step: ${snapshot.currentStepId}.` : "";
    emit("long_running", snapshot.manifest, `ToolFlow run ${snapshot.manifest.runId} is still running after ${Math.round(elapsed / 60000)} minute(s). ${completedSteps(snapshot.manifest)}/${totalSteps} step(s) completed.${stepText}`.trim(), snapshot.currentStepId);
  }

  return {
    start() {
      emit("run_started", getSnapshot().manifest, `ToolFlow run ${getSnapshot().manifest.runId} started for workflow \"${getSnapshot().manifest.workflowName}\".`);
      interval = setInterval(() => maybeEmitLongRunning(getSnapshot()), Math.min(Math.max(progress.intervalMs, 30_000), 60_000));
      interval.unref?.();
    },
    stop() {
      if (interval) clearInterval(interval);
      interval = undefined;
    },
    onStepStarted(stepId, manifest) {
      maybeEmitLongRunning({ manifest, currentStepId: stepId });
      if (!longRunningStarted) return;
      emit("step_started", manifest, `ToolFlow run ${manifest.runId} started step ${stepId}.`, stepId);
    },
    onStepCompleted(stepId, manifest) {
      maybeEmitLongRunning({ manifest, currentStepId: stepId });
      if (!longRunningStarted) return;
      emit("step_completed", manifest, `ToolFlow run ${manifest.runId} completed step ${stepId}. ${completedSteps(manifest)}/${totalSteps} step(s) finished.`, stepId);
    },
    onApprovalWait(stepId, manifest) {
      maybeEmitLongRunning({ manifest, currentStepId: stepId }, true);
      emit("approval_wait", manifest, `ToolFlow run ${manifest.runId} is waiting for approval on step ${stepId}.`, stepId);
    },
    onRunCompleted(manifest) {
      if (longRunningStarted || elapsedMs(manifest) >= progress.longRunThresholdMs) {
        emit("run_completed", manifest, `ToolFlow run ${manifest.runId} finished with state ${manifest.state}. ${completedSteps(manifest)}/${totalSteps} step(s) completed.`);
      }
    }
  };
}

function silentMonitor(): RunProgressMonitor {
  return {
    start() {},
    stop() {},
    onStepStarted() {},
    onStepCompleted() {},
    onApprovalWait() {},
    onRunCompleted() {}
  };
}

function defaultReporter(config: RuntimeConfig): (event: RuntimeProgressEvent) => void {
  return (event) => {
    if (config.progressUpdates.sink === "command" && config.progressUpdates.command) {
      const child = spawn(config.progressUpdates.command, {
        shell: true,
        stdio: "ignore",
        env: {
          ...process.env,
          TOOLFLOW_PROGRESS_JSON: JSON.stringify(event),
          TOOLFLOW_PROGRESS_TEXT: event.message,
          TOOLFLOW_PROGRESS_RUN_ID: event.runId,
          TOOLFLOW_PROGRESS_STATE: event.state,
          TOOLFLOW_PROGRESS_STEP_ID: event.currentStepId ?? ""
        }
      });
      child.on("error", () => undefined);
      return;
    }
    console.error(`[toolflow-progress] ${JSON.stringify(event)}`);
  };
}

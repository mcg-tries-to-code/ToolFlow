import type {
  ControllerDecision,
  ControllerState,
  LinkedRunStatus,
  TaskFlowBinding,
  ToolflowBinding,
  WakeReason,
} from "./controller-contract";

function mapToolflowToController(runState: LinkedRunStatus): "running" | "waiting" | "blocked" {
  switch (runState) {
    case "ready":
    case "running":
      return "running";
    case "awaiting_approval":
      return "waiting";
    case "failed":
    case "quarantined":
    case "rejected":
      return "blocked";
    case "cancelled":
      return "blocked";
    case "succeeded":
      return "running";
  }
}

export class NativeTaskflowController {
  constructor(
    private readonly taskflow: TaskFlowBinding,
    private readonly toolflow: ToolflowBinding,
  ) {}

  async create(input: {
    controllerId: string;
    goal: string;
    doneDefinition: string;
    blockerDefinition: string;
    firstStep: string;
    firstObjective: string;
  }) {
    const now = new Date().toISOString();
    const state: ControllerState = {
      version: 1,
      goal: input.goal,
      doneDefinition: input.doneDefinition,
      blockerDefinition: input.blockerDefinition,
      planVersion: 1,
      currentObjective: input.firstObjective,
      linkedRuns: [],
      pendingDecisions: [],
      artifacts: [],
      lastMaterialProgressAt: now,
    };

    return this.taskflow.createManaged({
      controllerId: input.controllerId,
      goal: input.goal,
      currentStep: input.firstStep,
      stateJson: state,
    });
  }

  async advance(input: {
    flowId: string;
    revision: number;
    state: ControllerState;
    decision: ControllerDecision;
  }) {
    const { flowId, revision, state, decision } = input;

    if (decision.launchWorkflowPath && decision.launchPurpose) {
      const child = await this.toolflow.startRun({
        workflowPath: decision.launchWorkflowPath,
        purpose: decision.launchPurpose,
      });
      state.linkedRuns.push({
        kind: "toolflow",
        runId: child.runId,
        purpose: decision.launchPurpose,
        status: child.state,
        workflowName: child.workflowName,
        lastSeenAt: new Date().toISOString(),
      });
    }

    if (decision.status === "running") {
      return this.taskflow.resume({
        flowId,
        expectedRevision: revision,
        status: "running",
        currentStep: decision.currentStep,
        stateJson: state,
      });
    }

    if (decision.status === "waiting") {
      return this.taskflow.setWaiting({
        flowId,
        expectedRevision: revision,
        currentStep: decision.currentStep,
        stateJson: state,
        waitJson: decision.waitJson ?? { kind: "manual", reason: "controller omitted explicit waitJson" },
        blockedSummary: decision.blockedSummary,
      });
    }

    if (decision.status === "done") {
      await this.taskflow.finish({
        flowId,
        expectedRevision: revision,
        stateJson: state,
      });
      return { applied: true };
    }

    if (decision.status === "failed" || decision.status === "blocked") {
      await this.taskflow.fail({
        flowId,
        expectedRevision: revision,
        stateJson: state,
        blockedSummary: decision.blockedSummary ?? "controller marked the flow blocked without a detailed summary",
      });
      return { applied: true };
    }

    throw new Error(`Unsupported terminal transition: ${decision.status}`);
  }

  async reconcileLinkedRuns(state: ControllerState) {
    for (const run of state.linkedRuns) {
      const latest = await this.toolflow.getRunStatus(run.runId);
      run.status = latest.state;
      run.workflowName = latest.workflowName ?? run.workflowName;
      run.lastSeenAt = new Date().toISOString();
    }
    return state;
  }

  async onWake(input: {
    flowId: string;
    revision: number;
    state: ControllerState;
    wake: WakeReason;
    decideNext: (state: ControllerState, wake: WakeReason) => Promise<ControllerDecision>;
  }) {
    const reconciled = await this.reconcileLinkedRuns(input.state);

    for (const run of reconciled.linkedRuns) {
      const mapped = mapToolflowToController(run.status);
      if (mapped === "waiting") {
        return this.taskflow.setWaiting({
          flowId: input.flowId,
          expectedRevision: input.revision,
          currentStep: "awaiting_toolflow_approval",
          stateJson: reconciled,
          waitJson: {
            kind: "approval",
            system: "toolflow",
            runId: run.runId,
          },
          blockedSummary: `ToolFlow run ${run.runId} requires approval.`,
        });
      }
      if (mapped === "blocked") {
        await this.taskflow.fail({
          flowId: input.flowId,
          expectedRevision: input.revision,
          stateJson: reconciled,
          blockedSummary: `ToolFlow run ${run.runId} is ${run.status} and requires controller review.`,
        });
        return { applied: true };
      }
    }

    const decision = await input.decideNext(reconciled, input.wake);
    return this.advance({
      flowId: input.flowId,
      revision: input.revision,
      state: reconciled,
      decision,
    });
  }
}

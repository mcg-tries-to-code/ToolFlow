import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { compileWorkflowFile } from "../compiler/compile";
import { approveRunStep, cancelRun, dryRun, getRunReceipts, getRunStatus, inspectRun, resumeWorkflow, runWorkflow } from "../control-plane/run-service";
import { resolveConfig } from "../config/resolve";
import { LedgerStore } from "../ledger/store";
import { recoverRun, recoveryStatus } from "../control-plane/recovery-service";

export async function main(argv: string[]): Promise<void> {
  const [command, ...args] = argv;
  try {
    if (!command || command === "help" || command === "--help") return help();
    if (command === "validate") return validate(args);
    if (command === "dry-run") return print(dryRun(required(args[0], "workflow path")));
    if (command === "run") return print(await runWorkflow(required(args[0], "workflow path")));
    if (command === "resume") return print(await resumeWorkflow(required(args[0], "run id")));
    if (command === "approve") return print(approveRunStep(required(args[0], "run id"), required(args[1], "step id"), args[2] ?? "operator"));
    if (command === "cancel") return print(cancelRun(required(args[0], "run id"), args[1] ?? "operator_cancelled"));
    if (command === "recover") return print(recoverRun(new LedgerStore(resolveConfig().ledgerRoot), required(args[0], "run id")));
    if (command === "receipts") return print(getRunReceipts(args[0]));
    if (command === "status") return print(getRunStatus(args[0]));
    if (command === "inspect") return print(inspectRun(args[0]));
    if (command === "doctor") return doctor();
    throw new Error(`Unknown command "${command}".`);
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}

function validate(args: string[]): void {
  const workflowPath = required(args[0], "workflow path");
  const result = compileWorkflowFile(workflowPath);
  print({ ok: true, workflowName: result.source.name, graphHash: result.compiledGraph.graphHash, steps: result.compiledGraph.nodes.length });
}

function doctor(): void {
  const config = resolveConfig();
  const store = new LedgerStore(config.ledgerRoot);
  print({
    ok: true,
    profile: "safe",
    ledgerRoot: config.ledgerRoot,
    ledgerExists: existsSync(config.ledgerRoot),
      runCount: store.listRunIds().length,
      bridgeMode: config.enableElevated ? "safe+elevated" : "same-process-typed-contracts",
      elevatedLane: config.enableElevated ? { enabled: true, allowedCommands: config.elevatedAllowedCommands } : { enabled: false },
      recovery: recoveryStatus()
    });
}

function help(): void {
  console.log(`ToolFlow v5 Safe Profile MVP

Usage:
  toolflow validate <workflow.json>
  toolflow dry-run <workflow.json>
  toolflow run <workflow.json>
  toolflow resume <run_id>
  toolflow approve <run_id> <step_id> [approved_by]
  toolflow cancel <run_id> [reason]
  toolflow recover <run_id>
  toolflow receipts [run_id]
  toolflow status [run_id]
  toolflow inspect [run_id]
  toolflow doctor

Optional progress env:
  TOOLFLOW_PROGRESS_ENABLED=1
  TOOLFLOW_PROGRESS_AFTER_SECONDS=300
  TOOLFLOW_PROGRESS_INTERVAL_SECONDS=300
  TOOLFLOW_PROGRESS_SINK=stderr|command
  TOOLFLOW_PROGRESS_COMMAND='openclaw system event --text "$TOOLFLOW_PROGRESS_TEXT" --mode now'

Ledger: ${resolve("data/ledger")}`);
}

function required(value: string | undefined, label: string): string {
  if (!value) throw new Error(`Missing ${label}.`);
  return value;
}

function print(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

import { spawn } from "node:child_process";
import { resolve } from "node:path";
import type { BridgeExecutionResult, BridgeRequest } from "@toolflow/shared";

export async function runSessionCell(request: BridgeRequest): Promise<BridgeExecutionResult> {
  if (request.action === "session_note") {
    const prompt = typeof request.payload.prompt === "string" ? request.payload.prompt : "";
    return { ok: true, output: { mode: "local_session_note", prompt, response: `MVP session note recorded: ${prompt}` } };
  }
  if (request.action === "health_downtrend_monitor") {
    return runHealthDowntrendMonitor(request);
  }
  if (request.action === "workspace_governance_monthly") {
    return runWorkspaceGovernanceMonthly(request);
  }
  return { ok: false, error: `Unsupported session action ${request.action}.` };
}

async function runHealthDowntrendMonitor(request: BridgeRequest): Promise<BridgeExecutionResult> {
  const workspaceRoot = typeof request.payload.workspaceRoot === "string" ? resolve(request.payload.workspaceRoot) : process.cwd();
  const scriptPath = resolve(typeof request.payload.scriptPath === "string" ? request.payload.scriptPath : `${workspaceRoot}/scripts/check_health_downtrends.py`);
  const pythonBin = typeof request.payload.pythonBin === "string" ? request.payload.pythonBin : "python3";
  const args = [scriptPath];
  const stringFlags: Array<[string, unknown]> = [
    ["--sheet-id", request.payload.sheetId],
    ["--range", request.payload.sheetRange],
    ["--state-path", request.payload.statePath],
    ["--target", request.payload.target]
  ];
  for (const [flag, value] of stringFlags) {
    if (typeof value === "string" && value.length) args.push(flag, value);
  }
  if (request.payload.dryRun === true) args.push("--dry-run");
  const result = await spawnCapture(pythonBin, args, workspaceRoot);
  if (result.exitCode !== 0) return { ok: false, error: result.stderr || result.stdout || `health_downtrend_monitor exited with ${result.exitCode}` };
  let parsed: Record<string, unknown> | undefined;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    parsed = undefined;
  }
  return { ok: true, output: { mode: "health_downtrend_monitor", command: [pythonBin, ...args], stdout: result.stdout, stderr: result.stderr, parsed } };
}

async function runWorkspaceGovernanceMonthly(request: BridgeRequest): Promise<BridgeExecutionResult> {
  const workspaceRoot = typeof request.payload.workspaceRoot === "string" ? resolve(request.payload.workspaceRoot) : process.cwd();
  const scriptPath = resolve(typeof request.payload.scriptPath === "string" ? request.payload.scriptPath : `${workspaceRoot}/scripts/run_workspace_governance_monthly.sh`);
  const shellBin = typeof request.payload.shellBin === "string" ? request.payload.shellBin : "/bin/zsh";
  const result = await spawnCapture(shellBin, [scriptPath], workspaceRoot);
  if (result.exitCode !== 0) return { ok: false, error: result.stderr || result.stdout || `workspace_governance_monthly exited with ${result.exitCode}` };
  return {
    ok: true,
    output: {
      mode: "workspace_governance_monthly",
      command: [shellBin, scriptPath],
      stdout: result.stdout,
      stderr: result.stderr,
      reportsDir: resolve(workspaceRoot, "reports"),
      tmpDir: resolve(workspaceRoot, "tmp/workspace-governance")
    }
  };
}

function spawnCapture(command: string, args: string[], cwd: string): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", reject);
    child.on("close", (exitCode) => resolvePromise({ exitCode, stdout, stderr }));
  });
}

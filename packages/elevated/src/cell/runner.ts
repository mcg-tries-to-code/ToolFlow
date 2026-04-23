import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, resolve } from "node:path";
import { spawn } from "node:child_process";
import type { BridgeExecutionResult, BridgeRequest } from "@toolflow/shared";
import { resolveElevatedConfig } from "../config/resolve";

export async function runElevatedCell(request: BridgeRequest): Promise<BridgeExecutionResult> {
  if (request.action === "exec_command") return runExecCommand(request);
  if (request.action === "apply_patch") return runApplyPatch(request);
  return { ok: false, error: `Unsupported elevated action ${request.action}.` };
}

async function runExecCommand(request: BridgeRequest): Promise<BridgeExecutionResult> {
  const command = arrayOfStrings(request.payload.command, "command");
  const [binary, ...args] = command;
  if (!binary) throw new Error("Missing command binary.");
  const config = resolveElevatedConfig();
  if (!config.allowedCommands.includes(binary)) throw new Error(`Command "${binary}" is not in the elevated allowlist.`);
  const cwd = typeof request.payload.cwd === "string" ? resolve(request.payload.cwd) : process.cwd();
  const timeoutMs = typeof request.payload.timeoutMs === "number" ? request.payload.timeoutMs : 10_000;
  const result = await spawnCapture(binary, args, { cwd, timeoutMs });
  return { ok: result.exitCode === 0, output: { command, cwd, ...result }, error: result.exitCode === 0 ? undefined : `Command exited with ${result.exitCode}.` };
}

async function runApplyPatch(request: BridgeRequest): Promise<BridgeExecutionResult> {
  const patch = stringArg(request.payload.patch, "patch");
  const cwd = typeof request.payload.cwd === "string" ? resolve(request.payload.cwd) : process.cwd();
  const tempDir = await mkdtemp(resolve(tmpdir(), "toolflow-patch-"));
  const patchPath = resolve(tempDir, `${basename(cwd) || "workspace"}.patch`);
  await writeFile(patchPath, patch, "utf8");
  const result = await spawnCapture("git", ["apply", "--recount", "--whitespace=nowarn", patchPath], { cwd, timeoutMs: 10_000 });
  const output: Record<string, unknown> = { cwd, patchPath, ...result };
  if (result.exitCode === 0 && typeof request.payload.verifyFile === "string") {
    output.verifyFile = resolve(cwd, request.payload.verifyFile);
    output.verifyContent = await readFile(output.verifyFile as string, "utf8");
  }
  return { ok: result.exitCode === 0, output, error: result.exitCode === 0 ? undefined : `Patch apply failed with ${result.exitCode}.` };
}

function stringArg(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`Missing string argument "${name}".`);
  return value;
}

function arrayOfStrings(value: unknown, name: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) throw new Error(`Expected string array argument "${name}".`);
  return value;
}

function spawnCapture(command: string, args: string[], options: { cwd: string; timeoutMs: number }): Promise<{ exitCode: number | null; stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGTERM"), options.timeoutMs);
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (exitCode) => {
      clearTimeout(timer);
      resolvePromise({ exitCode, stdout, stderr });
    });
  });
}

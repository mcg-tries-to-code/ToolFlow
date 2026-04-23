import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const workflow = "packages/examples/workflows/safe-profile-mvp.json";
const cli = ["packages/runtime/dist/main.js"];

function runCli(args, ledgerRoot, env = {}) {
  const result = spawnSync(process.execPath, [...cli, ...args], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, TOOLFLOW_LEDGER_DIR: ledgerRoot, ...env },
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function runCliFailure(args, ledgerRoot, env = {}) {
  const result = spawnSync(process.execPath, [...cli, ...args], {
    cwd: new URL("..", import.meta.url),
    env: { ...process.env, TOOLFLOW_LEDGER_DIR: ledgerRoot, ...env },
    encoding: "utf8"
  });
  assert.notEqual(result.status, 0, result.stdout);
  return result;
}

function hashJson(value) {
  return `sha256:${createHash("sha256").update(canonicalJson(value)).digest("hex")}`;
}

function canonicalJson(value) {
  return JSON.stringify(sortForJson(value));
}

function sortForJson(value) {
  if (Array.isArray(value)) return value.map(sortForJson);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, sortForJson(value[key])]));
  }
  return value;
}

test("validate and dry-run produce stable MVP artifacts", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const validated = runCli(["validate", workflow], ledger);
  assert.equal(validated.ok, true);
  assert.equal(validated.steps, 3);

  const dry = runCli(["dry-run", workflow], ledger);
  assert.equal(dry.proofBundle.decision, "allow_with_warnings");
  assert.equal(dry.policyArtifact.bridgeMode, "same-process-typed-contracts");
  assert.deepEqual(dry.proofBundle.requiredCells, ["read", "research", "session"]);
});

test("run executes ordinary typed bridge and cell path", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const manifest = runCli(["run", workflow], ledger);
  assert.equal(manifest.state, "succeeded");
  assert.equal(Object.values(manifest.steps).every((step) => step.state === "succeeded"), true);

  const status = runCli(["status", manifest.runId], ledger);
  assert.equal(status.runId, manifest.runId);

  const inspected = runCli(["inspect", manifest.runId], ledger);
  assert.equal(inspected.policyArtifact.profile, "safe");
  assert.equal(inspected.compiledGraph.nodes.length, 3);

  const output = JSON.parse(readFileSync(manifest.steps.session_summary_note.outputPath, "utf8"));
  assert.equal(output.status, "succeeded");
  assert.equal(output.output.mode, "local_session_note");
});

test("elevated lane pauses for approval, then resumes exact approved payload", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const workdir = mkdtempSync(join(tmpdir(), "toolflow-elevated-"));
  const targetFile = join(workdir, "target.txt");
  const workflowPath = join(workdir, "elevated-workflow.json");
  const patch = [
    "--- target.txt",
    "+++ target.txt",
    "@@ -1 +1 @@",
    "-alpha",
    "+beta",
    ""
  ].join("\n");
  const workflowSource = {
    schemaVersion: "toolflow.workflow/v1",
    name: "elevated-lane-test",
    steps: [
      {
        id: "write_target",
        action: "exec_command",
        args: {
          cwd: workdir,
          command: [process.execPath, "-e", `require('node:fs').writeFileSync(${JSON.stringify(targetFile)}, 'alpha\\n')`]
        }
      },
      {
        id: "patch_target",
        action: "apply_patch",
        dependsOn: ["write_target"],
        args: {
          cwd: workdir,
          patch,
          verifyFile: "target.txt"
        }
      }
    ]
  };
  writeFileSync(workflowPath, JSON.stringify(workflowSource, null, 2));

  const env = { TOOLFLOW_ENABLE_ELEVATED: "1", TOOLFLOW_ELEVATED_ALLOW: `${process.execPath},git` };
  const initial = runCli(["run", workflowPath], ledger, env);
  assert.equal(initial.state, "awaiting_approval");
  assert.equal(initial.steps.write_target.state, "awaiting_approval");

  runCli(["approve", initial.runId, "write_target", "test-operator"], ledger, env);
  const second = runCli(["resume", initial.runId], ledger, env);
  assert.equal(second.state, "awaiting_approval");
  assert.equal(second.steps.write_target.state, "succeeded");
  assert.equal(second.steps.patch_target.state, "awaiting_approval");

  runCli(["approve", initial.runId, "patch_target", "test-operator"], ledger, env);
  const final = runCli(["resume", initial.runId], ledger, env);
  assert.equal(final.state, "succeeded");
  assert.equal(readFileSync(targetFile, "utf8"), "beta\n");
});

test("recover requeues expired issued grants for replayable steps", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const manifest = runCli(["run", workflow], ledger);
  const runDir = join(ledger, "runs", manifest.runId);
  const manifestPath = join(runDir, "manifest.json");
  const mutatedManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const step = mutatedManifest.steps.read_readme;
  const grantPath = join(runDir, "grants", `${step.grantId}.json`);
  const grantRecord = JSON.parse(readFileSync(grantPath, "utf8"));
  const receiptPath = join(runDir, "receipts", `${step.receiptId}.json`);
  if (existsSync(receiptPath)) rmSync(receiptPath);

  grantRecord.state = "issued";
  grantRecord.receiptId = undefined;
  grantRecord.consumedAt = undefined;
  grantRecord.grant.expiresAt = "2000-01-01T00:00:00.000Z";
  writeFileSync(grantPath, JSON.stringify(grantRecord, null, 2));

  mutatedManifest.state = "running";
  mutatedManifest.steps.read_readme.state = "grant_issued";
  mutatedManifest.steps.read_readme.receiptId = undefined;
  writeFileSync(manifestPath, JSON.stringify(mutatedManifest, null, 2));

  const recovered = runCli(["recover", manifest.runId], ledger);
  const postManifest = runCli(["status", manifest.runId], ledger);
  const postGrant = JSON.parse(readFileSync(grantPath, "utf8"));

  assert.equal(recovered.nextState, "ready");
  assert.equal(postManifest.steps.read_readme.state, "pending");
  assert.equal(postGrant.state, "expired");
});

test("recover quarantines review-before-replay steps with consumed grant and missing receipt", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const workdir = mkdtempSync(join(tmpdir(), "toolflow-elevated-"));
  const targetFile = join(workdir, "target.txt");
  const workflowPath = join(workdir, "elevated-recovery.json");
  const workflowSource = {
    schemaVersion: "toolflow.workflow/v1",
    name: "elevated-recovery-test",
    steps: [
      {
        id: "write_target",
        action: "exec_command",
        args: {
          cwd: workdir,
          command: [process.execPath, "-e", `require('node:fs').writeFileSync(${JSON.stringify(targetFile)}, 'alpha\\n')`]
        }
      }
    ]
  };
  writeFileSync(workflowPath, JSON.stringify(workflowSource, null, 2));

  const env = { TOOLFLOW_ENABLE_ELEVATED: "1", TOOLFLOW_ELEVATED_ALLOW: `${process.execPath}` };
  const initial = runCli(["run", workflowPath], ledger, env);
  runCli(["approve", initial.runId, "write_target", "test-operator"], ledger, env);
  const final = runCli(["resume", initial.runId], ledger, env);

  const runDir = join(ledger, "runs", final.runId);
  const manifestPath = join(runDir, "manifest.json");
  const mutatedManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const step = mutatedManifest.steps.write_target;
  const grantPath = join(runDir, "grants", `${step.grantId}.json`);
  const grantRecord = JSON.parse(readFileSync(grantPath, "utf8"));
  const receiptPath = join(runDir, "receipts", `${step.receiptId}.json`);
  if (existsSync(receiptPath)) rmSync(receiptPath);

  mutatedManifest.state = "running";
  mutatedManifest.steps.write_target.state = "running";
  mutatedManifest.steps.write_target.receiptId = undefined;
  writeFileSync(manifestPath, JSON.stringify(mutatedManifest, null, 2));

  grantRecord.receiptId = undefined;
  writeFileSync(grantPath, JSON.stringify(grantRecord, null, 2));

  const recovered = runCli(["recover", final.runId], ledger, env);
  const postManifest = runCli(["status", final.runId], ledger, env);

  assert.equal(recovered.nextState, "quarantined");
  assert.equal(postManifest.steps.write_target.state, "quarantined");
});

test("receipts command lists authoritative receipts for a run", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const manifest = runCli(["run", workflow], ledger);
  const receipts = runCli(["receipts", manifest.runId], ledger);
  assert.equal(receipts.runId, manifest.runId);
  assert.equal(receipts.receipts.length, 3);
  assert.equal(receipts.receipts.every((receipt) => receipt.signature), true);
});

test("cancel transitions an approval-paused run into cancelled state", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const workdir = mkdtempSync(join(tmpdir(), "toolflow-elevated-"));
  const workflowPath = join(workdir, "cancel-workflow.json");
  writeFileSync(workflowPath, JSON.stringify({
    schemaVersion: "toolflow.workflow/v1",
    name: "cancel-test",
    steps: [
      { id: "dangerous", action: "exec_command", args: { cwd: workdir, command: [process.execPath, "-e", "console.log('x')"] } }
    ]
  }, null, 2));
  const env = { TOOLFLOW_ENABLE_ELEVATED: "1", TOOLFLOW_ELEVATED_ALLOW: `${process.execPath}` };
  const initial = runCli(["run", workflowPath], ledger, env);
  assert.equal(initial.state, "awaiting_approval");
  const cancelled = runCli(["cancel", initial.runId, "test_cancel"], ledger, env);
  assert.equal(cancelled.state, "cancelled");
  assert.equal(cancelled.steps.dangerous.state, "cancelled");
});

test("approval bound to old payload cannot authorize changed payload", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const workdir = mkdtempSync(join(tmpdir(), "toolflow-elevated-"));
  const targetFile = join(workdir, "target.txt");
  const workflowPath = join(workdir, "approval-mismatch.json");
  writeFileSync(workflowPath, JSON.stringify({
    schemaVersion: "toolflow.workflow/v1",
    name: "approval-mismatch-test",
    steps: [
      {
        id: "write_target",
        action: "exec_command",
        args: { cwd: workdir, command: [process.execPath, "-e", `require('node:fs').writeFileSync(${JSON.stringify(targetFile)}, 'alpha\\n')`] }
      }
    ]
  }, null, 2));

  const env = { TOOLFLOW_ENABLE_ELEVATED: "1", TOOLFLOW_ELEVATED_ALLOW: `${process.execPath}` };
  const initial = runCli(["run", workflowPath], ledger, env);
  runCli(["approve", initial.runId, "write_target", "test-operator"], ledger, env);

  const compiledGraphPath = join(ledger, "runs", initial.runId, "compiled-graph.json");
  const compiledGraph = JSON.parse(readFileSync(compiledGraphPath, "utf8"));
  compiledGraph.nodes[0].payload.command = [process.execPath, "-e", `require('node:fs').writeFileSync(${JSON.stringify(targetFile)}, 'beta\\n')`];
  compiledGraph.nodes[0].payloadHash = hashJson(compiledGraph.nodes[0].payload);
  writeFileSync(compiledGraphPath, JSON.stringify(compiledGraph, null, 2));

  const failed = runCliFailure(["resume", initial.runId], ledger, env);
  assert.match(failed.stderr || failed.stdout, /approval payload binding mismatch/i);
});

test("health downtrend monitor is rejected from the public action set", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const workdir = mkdtempSync(join(tmpdir(), "toolflow-health-"));
  const workflowPath = join(workdir, "health-workflow.json");

  writeFileSync(workflowPath, JSON.stringify({
    schemaVersion: "toolflow.workflow/v1",
    name: "health-downtrend-monitor-test",
    steps: [
      {
        id: "health_downtrend_monitor",
        action: "health_downtrend_monitor",
        args: { dryRun: true }
      }
    ]
  }, null, 2));

  const failed = runCliFailure(["run", workflowPath], ledger);
  assert.match(failed.stderr || failed.stdout, /Action "health_downtrend_monitor" is not supported by ToolFlow/i);
});

test("workspace governance monthly is rejected from the public action set", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-test-"));
  const workdir = mkdtempSync(join(tmpdir(), "toolflow-governance-"));
  const workflowPath = join(workdir, "workspace-governance-workflow.json");

  writeFileSync(workflowPath, JSON.stringify({
    schemaVersion: "toolflow.workflow/v1",
    name: "workspace-governance-monthly-test",
    steps: [
      {
        id: "workspace_governance_monthly",
        action: "workspace_governance_monthly",
        args: {}
      }
    ]
  }, null, 2));

  const failed = runCliFailure(["run", workflowPath], ledger);
  assert.match(failed.stderr || failed.stdout, /Action "workspace_governance_monthly" is not supported by ToolFlow/i);
});

test("progress updates emit structured stderr events for long-running runs", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-progress-"));
  const result = spawnSync(process.execPath, [...cli, "run", workflow], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      TOOLFLOW_LEDGER_DIR: ledger,
      TOOLFLOW_PROGRESS_ENABLED: "1",
      TOOLFLOW_PROGRESS_AFTER_SECONDS: "0",
      TOOLFLOW_PROGRESS_INTERVAL_SECONDS: "0"
    },
    encoding: "utf8"
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stderr, /\[toolflow-progress\]/);
  assert.match(result.stderr, /"type":\s*"run_started"/);
});

test("progress command sink receives live update payloads", () => {
  const ledger = mkdtempSync(join(tmpdir(), "toolflow-progress-cmd-"));
  const workdir = mkdtempSync(join(tmpdir(), "toolflow-progress-hook-"));
  const hookPath = join(workdir, "hook.sh");
  const logPath = join(workdir, "progress.log");

  writeFileSync(hookPath, [
    "#!/bin/zsh",
    "set -euo pipefail",
    `print -r -- \"$TOOLFLOW_PROGRESS_TEXT\" >> ${JSON.stringify(logPath)}`
  ].join("\n"));
  spawnSync("chmod", ["+x", hookPath]);

  const result = spawnSync(process.execPath, [...cli, "run", workflow], {
    cwd: new URL("..", import.meta.url),
    env: {
      ...process.env,
      TOOLFLOW_LEDGER_DIR: ledger,
      TOOLFLOW_PROGRESS_ENABLED: "1",
      TOOLFLOW_PROGRESS_AFTER_SECONDS: "0",
      TOOLFLOW_PROGRESS_INTERVAL_SECONDS: "0",
      TOOLFLOW_PROGRESS_SINK: "command",
      TOOLFLOW_PROGRESS_COMMAND: hookPath
    },
    encoding: "utf8"
  });

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(existsSync(logPath), true);
  const progressLog = readFileSync(logPath, "utf8");
  assert.match(progressLog, /ToolFlow run/);
  assert.match(progressLog, /started/);
});

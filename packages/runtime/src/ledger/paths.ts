import { join, resolve } from "node:path";

export interface LedgerPaths {
  root: string;
  runs: string;
}

export function resolveLedgerPaths(root = process.env.TOOLFLOW_LEDGER_DIR): LedgerPaths {
  const ledgerRoot = resolve(root ?? "data/ledger");
  return { root: ledgerRoot, runs: join(ledgerRoot, "runs") };
}

export function runDir(ledgerRoot: string, runId: string): string {
  return join(ledgerRoot, "runs", runId);
}

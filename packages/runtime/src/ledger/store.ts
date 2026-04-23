import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { canonicalJson, nowIso } from "@toolflow/shared";
import type { RunId } from "@toolflow/shared";

export class LedgerStore {
  constructor(readonly root: string) {
    mkdirSync(join(root, "runs"), { recursive: true });
  }

  runPath(runId: string, ...parts: string[]): string {
    return join(this.root, "runs", runId, ...parts);
  }

  ensureRun(runId: string): void {
    mkdirSync(this.runPath(runId, "artifacts"), { recursive: true });
    mkdirSync(this.runPath(runId, "approvals"), { recursive: true });
    mkdirSync(this.runPath(runId, "checkpoints"), { recursive: true });
    mkdirSync(this.runPath(runId, "grants"), { recursive: true });
    mkdirSync(this.runPath(runId, "receipts"), { recursive: true });
  }

  writeJson(path: string, value: unknown): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, `${canonicalJson(value)}\n`);
  }

  readJson<T>(path: string): T {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  }

  appendEvent(runId: string, type: string, data: Record<string, unknown> = {}): void {
    appendFileSync(this.runPath(runId, "events.jsonl"), `${canonicalJson({ at: nowIso(), type, ...data })}\n`);
  }

  listRunIds(): RunId[] {
    try {
      return readdirSync(join(this.root, "runs"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name.startsWith("run_"))
        .map((entry) => entry.name as RunId)
        .sort();
    } catch {
      return [];
    }
  }

  latestRunId(): RunId | undefined {
    return this.listRunIds().at(-1);
  }

  listJsonFiles(path: string): string[] {
    if (!existsSync(path)) return [];
    return readdirSync(path, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => join(path, entry.name))
      .sort();
  }
}

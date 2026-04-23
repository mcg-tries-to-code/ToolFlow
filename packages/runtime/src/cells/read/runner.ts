import { readFile, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";
import type { BridgeExecutionResult, BridgeRequest } from "@toolflow/shared";

export async function runReadCell(request: BridgeRequest): Promise<BridgeExecutionResult> {
  if (request.action === "read_file") {
    const path = stringArg(request.payload.path, "path");
    const content = await readFile(resolve(path), "utf8");
    return { ok: true, output: { path: resolve(path), content } };
  }
  if (request.action === "list_files") {
    const path = resolve(stringArg(request.payload.path ?? ".", "path"));
    const entries = await readdir(path);
    const files = [];
    for (const entry of entries.sort()) {
      const fullPath = resolve(path, entry);
      const info = await stat(fullPath);
      files.push({ name: entry, path: fullPath, type: info.isDirectory() ? "directory" : "file", size: info.size });
    }
    return { ok: true, output: { path, entries: files } };
  }
  return { ok: false, error: `Unsupported read action ${request.action}.` };
}

function stringArg(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(`Missing string argument "${name}".`);
  return value;
}

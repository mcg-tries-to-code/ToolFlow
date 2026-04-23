import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

export function readFileClient(path: string): { path: string; content: string } {
  const absolutePath = resolve(path);
  return { path: absolutePath, content: readFileSync(absolutePath, "utf8") };
}

export function listFilesClient(path = "."): { path: string; entries: { name: string; path: string; type: "file" | "directory"; size: number }[] } {
  const absolutePath = resolve(path);
  const entries = readdirSync(absolutePath).sort().map((entry) => {
    const fullPath = resolve(absolutePath, entry);
    const stat = statSync(fullPath);
    return { name: entry, path: fullPath, type: stat.isDirectory() ? "directory" as const : "file" as const, size: stat.size };
  });
  return { path: absolutePath, entries };
}

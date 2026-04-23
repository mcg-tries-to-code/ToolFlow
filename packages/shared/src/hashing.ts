import { createHash } from "node:crypto";

export type Hash = `sha256:${string}`;

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortForJson(value));
}

export function sha256(value: string | Uint8Array): Hash {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

export function hashJson(value: unknown): Hash {
  return sha256(canonicalJson(value));
}

function sortForJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForJson);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const entry = (value as Record<string, unknown>)[key];
      if (entry !== undefined) sorted[key] = sortForJson(entry);
    }
    return sorted;
  }
  return value;
}

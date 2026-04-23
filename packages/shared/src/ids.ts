import { randomBytes } from "node:crypto";
import { sha256 } from "./hashing";

export type RunId = `run_${string}`;
export type GrantId = `sg_${string}`;
export type ReceiptId = `rcpt_${string}`;
export type ArtifactId = `art_${string}`;

export function newRunId(seed?: string): RunId {
  return `run_${token(seed)}`;
}

export function newGrantId(seed?: string): GrantId {
  return `sg_${token(seed)}`;
}

export function newReceiptId(seed?: string): ReceiptId {
  return `rcpt_${token(seed)}`;
}

export function newArtifactId(seed?: string): ArtifactId {
  return `art_${token(seed)}`;
}

export function normalizeStepId(id: string): string {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(id)) {
    throw new Error(`Invalid step id "${id}". Use 1-64 alphanumeric, dash, or underscore characters.`);
  }
  return id;
}

function token(seed?: string): string {
  if (seed) return sha256(seed).slice("sha256:".length, "sha256:".length + 16);
  return randomBytes(8).toString("hex");
}

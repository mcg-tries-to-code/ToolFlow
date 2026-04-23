import { createHmac, timingSafeEqual } from "node:crypto";
import { canonicalJson } from "@toolflow/shared";
import type { RuntimeKey } from "./keyring";

export function signObject(value: Record<string, unknown>, key: RuntimeKey): string {
  return createHmac("sha256", key.secret).update(canonicalJson(value)).digest("hex");
}

export function verifyObject(value: Record<string, unknown>, signature: string, key: RuntimeKey): boolean {
  const expected = Buffer.from(signObject(value, key), "hex");
  const actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

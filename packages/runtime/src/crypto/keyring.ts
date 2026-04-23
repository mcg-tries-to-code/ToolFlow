import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";

export interface RuntimeKey {
  keyId: string;
  secret: string;
}

export function loadRuntimeKey(ledgerRoot: string): RuntimeKey {
  return loadKey(ledgerRoot, "ordinary-dev-key.json", "ordinary-dev-local");
}

export function loadElevatedRuntimeKey(ledgerRoot: string): RuntimeKey {
  return loadKey(ledgerRoot, "elevated-dev-key.json", "elevated-dev-local");
}

function loadKey(ledgerRoot: string, filename: string, defaultKeyId: string): RuntimeKey {
  const keyPath = join(ledgerRoot, "keys", filename);
  try {
    return JSON.parse(readFileSync(keyPath, "utf8")) as RuntimeKey;
  } catch {
    mkdirSync(dirname(keyPath), { recursive: true, mode: 0o700 });
    const key: RuntimeKey = { keyId: defaultKeyId, secret: randomBytes(32).toString("hex") };
    writeFileSync(keyPath, JSON.stringify(key, null, 2), { mode: 0o600 });
    return key;
  }
}

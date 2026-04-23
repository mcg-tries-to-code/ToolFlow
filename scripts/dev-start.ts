import { resolve } from "node:path";

const ledger = process.env.TOOLFLOW_LEDGER_DIR ?? resolve("data/ledger");

process.stdout.write(JSON.stringify({
  ok: true,
  mode: "local-dev",
  ledgerRoot: ledger,
  elevatedEnabled: process.env.TOOLFLOW_ENABLE_ELEVATED === "1",
  elevatedAllow: process.env.TOOLFLOW_ELEVATED_ALLOW?.split(",").map((value) => value.trim()).filter(Boolean) ?? []
}, null, 2) + "\n");

import { dryRun } from "../packages/runtime/dist/index.js";

const workflow = process.argv[2] ?? "packages/examples/workflows/safe-profile-mvp.json";
const result = dryRun(workflow);
process.stdout.write(JSON.stringify({
  ok: true,
  workflow,
  graphHash: result.compiledGraph.graphHash,
  decision: result.proofBundle.decision,
  profile: result.policyArtifact.profile
}, null, 2) + "\n");

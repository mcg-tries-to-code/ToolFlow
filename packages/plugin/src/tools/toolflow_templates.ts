import { resolve } from "node:path";

export function toolflow_templates() {
  return {
    templates: [
      resolve(__dirname, "../../examples/workflows/safe-profile-mvp.json")
    ]
  };
}

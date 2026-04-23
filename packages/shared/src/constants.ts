export const TOOLFLOW_VERSION = "toolflow/v5" as const;
export const WORKFLOW_SCHEMA_VERSION = "toolflow.workflow/v1" as const;
export const COMPILED_GRAPH_SCHEMA_VERSION = "toolflow.compiled-graph/v1" as const;
export const PROOF_BUNDLE_SCHEMA_VERSION = "toolflow.proof-bundle/v1" as const;
export const POLICY_ARTIFACT_SCHEMA_VERSION = "toolflow.policy-artifact/v1" as const;
export const STEP_GRANT_SCHEMA_VERSION = "toolflow.step-grant/v1" as const;
export const RECEIPT_SCHEMA_VERSION = "toolflow.receipt/v1" as const;
export const RUN_MANIFEST_SCHEMA_VERSION = "toolflow.run-manifest/v1" as const;

export const SAFE_PROFILE_CELLS = ["read", "research", "session"] as const;
export const SAFE_PROFILE_ACTIONS = ["read_file", "list_files", "research_note", "session_note", "health_downtrend_monitor", "workspace_governance_monthly"] as const;
export const ELEVATED_PROFILE_CELLS = ["elevated"] as const;
export const ELEVATED_PROFILE_ACTIONS = ["exec_command", "apply_patch"] as const;
export const TOOLFLOW_CELLS = [...SAFE_PROFILE_CELLS, ...ELEVATED_PROFILE_CELLS] as const;
export const TOOLFLOW_ACTIONS = [...SAFE_PROFILE_ACTIONS, ...ELEVATED_PROFILE_ACTIONS] as const;

import { createRuntimeClient } from "./client/runtime-client";

export * from "./client/runtime-client";
export * from "./config-schema";
export * from "./gateway/methods";
export * from "./runtime-store";
export * from "./services/runtime-supervisor";
export * from "./tools/toolflow_cancel";
export * from "./tools/toolflow_dry_run";
export * from "./tools/toolflow_inspect";
export * from "./tools/toolflow_receipts";
export * from "./tools/toolflow_status";
export * from "./tools/toolflow_submit";
export * from "./tools/toolflow_templates";

type Api = any;

type PluginConfig = {
  ledgerRoot?: string;
  taskflowMirrorRoot?: string;
  enableElevated?: boolean;
  elevatedAllowedCommands?: string[];
  progressUpdates?: {
    enabled?: boolean;
    longRunThresholdMs?: number;
    intervalMs?: number;
    sink?: "stderr" | "command";
    command?: string;
  };
};

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], details: {} };
}

function errorResult(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], details: {} };
}

export default function register(api: Api) {
  api.logger.info("ToolFlow plugin loaded");

  const getClient = () => createRuntimeClient((api.pluginConfig ?? {}) as PluginConfig);

  const tools = [
    {
      name: "toolflow_submit",
      label: "ToolFlow Submit",
      description: "Run a ToolFlow workflow from a workflow path.",
      parameters: {
        type: "object",
        properties: {
          workflowPath: { type: "string", description: "Path to the ToolFlow workflow file." }
        },
        required: ["workflowPath"]
      },
      async execute(_toolCallId: string, params: Record<string, unknown>) {
        try {
          return textResult(await getClient().submit(params.workflowPath as string));
        } catch (error) {
          return errorResult((error as Error).message);
        }
      }
    },
    {
      name: "toolflow_dry_run",
      label: "ToolFlow Dry Run",
      description: "Compile and classify a ToolFlow workflow without running it.",
      parameters: {
        type: "object",
        properties: {
          workflowPath: { type: "string", description: "Path to the ToolFlow workflow file." }
        },
        required: ["workflowPath"]
      },
      async execute(_toolCallId: string, params: Record<string, unknown>) {
        try {
          return textResult(getClient().dryRun(params.workflowPath as string));
        } catch (error) {
          return errorResult((error as Error).message);
        }
      }
    },
    {
      name: "toolflow_status",
      label: "ToolFlow Status",
      description: "Read ToolFlow run status for a specific run or the latest run.",
      parameters: {
        type: "object",
        properties: {
          runId: { type: "string", description: "Optional ToolFlow run id." }
        },
        required: []
      },
      async execute(_toolCallId: string, params: Record<string, unknown>) {
        try {
          return textResult(getClient().status(params.runId as string | undefined));
        } catch (error) {
          return errorResult((error as Error).message);
        }
      }
    },
    {
      name: "toolflow_inspect",
      label: "ToolFlow Inspect",
      description: "Inspect ToolFlow manifest, graph, proof bundle, and policy artifact.",
      parameters: {
        type: "object",
        properties: {
          runId: { type: "string", description: "Optional ToolFlow run id." }
        },
        required: []
      },
      async execute(_toolCallId: string, params: Record<string, unknown>) {
        try {
          return textResult(getClient().inspect(params.runId as string | undefined));
        } catch (error) {
          return errorResult((error as Error).message);
        }
      }
    },
    {
      name: "toolflow_receipts",
      label: "ToolFlow Receipts",
      description: "List authoritative receipts for a ToolFlow run.",
      parameters: {
        type: "object",
        properties: {
          runId: { type: "string", description: "Optional ToolFlow run id." }
        },
        required: []
      },
      async execute(_toolCallId: string, params: Record<string, unknown>) {
        try {
          return textResult(getClient().receipts(params.runId as string | undefined));
        } catch (error) {
          return errorResult((error as Error).message);
        }
      }
    },
    {
      name: "toolflow_cancel",
      label: "ToolFlow Cancel",
      description: "Cancel a ToolFlow run.",
      parameters: {
        type: "object",
        properties: {
          runId: { type: "string", description: "ToolFlow run id." },
          reason: { type: "string", description: "Optional cancellation reason." }
        },
        required: ["runId"]
      },
      async execute(_toolCallId: string, params: Record<string, unknown>) {
        try {
          return textResult(getClient().cancel(params.runId as string, params.reason as string | undefined));
        } catch (error) {
          return errorResult((error as Error).message);
        }
      }
    },
    {
      name: "toolflow_templates",
      label: "ToolFlow Templates",
      description: "List packaged ToolFlow workflow templates.",
      parameters: { type: "object", properties: {}, required: [] },
      async execute() {
        try {
          return textResult({ templates: ["packages/examples/workflows/safe-profile-mvp.json"] });
        } catch (error) {
          return errorResult((error as Error).message);
        }
      }
    }
  ];

  for (const tool of tools) {
    api.registerTool(tool, { name: tool.name });
  }

  api.registerService({
    id: "toolflow",
    start: () => {
      api.logger.info("ToolFlow service started");
    },
    stop: () => {
      api.logger.info("ToolFlow service stopped");
    }
  });
}

export class ToolFlowError extends Error {
  constructor(
    message: string,
    readonly code = "TOOLFLOW_ERROR"
  ) {
    super(message);
    this.name = "ToolFlowError";
  }
}

export class ValidationError extends ToolFlowError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR");
  }
}

export class PolicyError extends ToolFlowError {
  constructor(message: string) {
    super(message, "POLICY_ERROR");
  }
}

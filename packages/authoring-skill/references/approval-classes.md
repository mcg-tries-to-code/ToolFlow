# Approval Classes

## Step-time approval

Current ToolFlow implementation uses **step-time approval**.

Use it when:
- the final payload is known only at runtime
- the step is elevated
- the approval must bind to an exact payload hash

Properties:
- approval is stored per run + step
- approval binds to payload hash and policy hash
- changing the payload invalidates the approval

## Submit-time approval

This remains a future extension.

It is appropriate only when the full elevated payload set is known and stable at submission time.

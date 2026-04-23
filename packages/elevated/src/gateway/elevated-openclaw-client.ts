export interface ElevatedGatewayClient {
  mode: "local-only";
}

export function createElevatedGatewayClient(): ElevatedGatewayClient {
  return { mode: "local-only" };
}

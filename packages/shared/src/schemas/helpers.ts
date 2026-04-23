export type SchemaCheck<T> = (value: unknown) => value is T;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function hasString(value: Record<string, unknown>, key: string): boolean {
  return typeof value[key] === "string" && value[key]!.length > 0;
}

export function hasObject(value: Record<string, unknown>, key: string): boolean {
  return isRecord(value[key]);
}

export function hasArray(value: Record<string, unknown>, key: string): boolean {
  return Array.isArray(value[key]);
}

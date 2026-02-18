export function asNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required`);
  }
  return trimmed;
}

export function asOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') throw new Error('Expected a string');
  return value.trim();
}

export function asBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${field} must be a boolean`);
  }
  return value;
}

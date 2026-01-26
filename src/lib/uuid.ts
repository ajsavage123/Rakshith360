/**
 * Generate a UUID v4 using crypto API
 */
export function generateUUID(): string {
  return crypto.randomUUID();
}

/** Parse an HTTP request body without turning malformed JSON into a 500. */
export async function readJsonObject(
  request: { json(): Promise<unknown> }
): Promise<Record<string, unknown> | null> {
  const value = await request.json().catch(() => null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

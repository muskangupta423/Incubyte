import type { z } from 'zod';

/**
 * Reads URL search params with a shared Zod schema (the same one the API uses).
 * Invalid values — e.g. a hand-edited ?page=abc — are dropped one by one, keeping the valid ones,
 * so a bad link still opens a sensible page instead of an error.
 */
export function parseSearchParams<Schema extends z.ZodType>(
  schema: Schema,
  searchParams: URLSearchParams,
): z.output<Schema> {
  const raw: Record<string, string> = Object.fromEntries(searchParams);
  const result = schema.safeParse(raw);
  if (result.success) return result.data;

  const invalidFields = new Set(result.error.issues.map((issue) => issue.path[0]));
  const validRaw = Object.fromEntries(
    Object.entries(raw).filter(([field]) => !invalidFields.has(field)),
  );
  return schema.parse(validRaw);
}

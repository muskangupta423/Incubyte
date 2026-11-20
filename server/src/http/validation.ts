import type { z } from 'zod';
import { ValidationError } from './errors';

/**
 * Validates untrusted input (query string, body) against a Zod schema.
 * Returns the parsed, typed value or throws a ValidationError listing every problem.
 */
export function parseInput<Schema extends z.ZodType>(
  schema: Schema,
  input: unknown,
): z.output<Schema> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  throw new ValidationError(
    result.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  );
}

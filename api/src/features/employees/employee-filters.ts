import type { InValue } from '@libsql/client';

export interface EmployeeFilters {
  search?: string | undefined;
  country?: string | undefined;
  department?: string | undefined;
  jobTitle?: string | undefined;
}

/**
 * Builds the WHERE clause for filtering employees (table alias `e`).
 * Shared by the employee list and the insights queries, so a filter always means the same thing.
 * Values are always passed as ? parameters, never concatenated into the SQL.
 */
export function buildEmployeeFilters(filters: EmployeeFilters): {
  whereSql: string;
  args: InValue[];
} {
  const conditions: string[] = [];
  const args: InValue[] = [];

  if (filters.search) {
    conditions.push(
      `(e.full_name LIKE ? ESCAPE '\\' OR e.email LIKE ? ESCAPE '\\' OR e.employee_code LIKE ? ESCAPE '\\')`,
    );
    const pattern = `%${escapeLikePattern(filters.search)}%`;
    args.push(pattern, pattern, pattern);
  }
  if (filters.country) {
    conditions.push('e.country = ?');
    args.push(filters.country);
  }
  if (filters.department) {
    conditions.push('e.department = ?');
    args.push(filters.department);
  }
  if (filters.jobTitle) {
    conditions.push('e.job_title = ?');
    args.push(filters.jobTitle);
  }

  return {
    whereSql: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    args,
  };
}

/** In LIKE, % and _ are wildcards. Escape them so a search for "50%" matches the text "50%". */
function escapeLikePattern(text: string): string {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}

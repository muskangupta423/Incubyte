import type { ImportCheckResult, ImportRequest, ImportResult } from '@acme/shared';
import { apiRequest } from '../../services/http-client';

/** Checks the rows and reports what would happen; saves nothing. */
export function checkImport(rows: ImportRequest['rows']) {
  return apiRequest<ImportCheckResult>('/employees/import/check', {
    method: 'POST',
    body: { rows },
  });
}

/** Saves all the rows, or nothing. */
export function runImport(rows: ImportRequest['rows']) {
  return apiRequest<ImportResult>('/employees/import', { method: 'POST', body: { rows } });
}

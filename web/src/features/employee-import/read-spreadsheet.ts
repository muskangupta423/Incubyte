import {
  IMPORT_COLUMNS,
  importColumnHeader,
  MAX_IMPORT_ROWS,
  REQUIRED_IMPORT_COLUMNS,
  type ImportColumnKey,
  type ImportRequest,
} from '@acme/shared';
import { read, SSF, utils, type WorkSheet } from 'xlsx';

/** Larger than any real 10,000-row sheet (~1 MB), small enough to read quickly in the browser. */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type ReadResult = { ok: true; rows: ImportRequest['rows'] } | { ok: false; message: string };

type Cell = string | number | boolean;

/**
 * Reads the first sheet of an .xlsx or .csv file into rows the API can check.
 * Only the file's structure is checked here (type, size, columns); the values are checked by the
 * API, with the same rules as the Add employee form.
 */
export async function readSpreadsheet(file: File): Promise<ReadResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension !== 'xlsx' && extension !== 'csv') {
    return { ok: false, message: 'Choose an Excel (.xlsx) or CSV (.csv) file.' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      message: 'The file is larger than 5 MB. Please split it into smaller files.',
    };
  }

  let sheet: WorkSheet | undefined;
  try {
    // CSV: keep every value as typed text (don't guess numbers or dates); the API understands both.
    const workbook = read(await file.arrayBuffer(), { type: 'array', raw: extension === 'csv' });
    const firstSheetName = workbook.SheetNames[0];
    sheet = firstSheetName === undefined ? undefined : workbook.Sheets[firstSheetName];
  } catch {
    return { ok: false, message: "This file couldn't be read. Is it a valid .xlsx or .csv file?" };
  }
  if (!sheet?.['!ref']) return { ok: false, message: 'The file has no employees in it.' };

  // One array per spreadsheet row (blank rows included, so row numbers stay true to the file).
  const table = utils.sheet_to_json<Cell[]>(sheet, { header: 1, blankrows: true, defval: '' });
  const firstRowNumber = utils.decode_range(sheet['!ref']).s.r + 1;
  const [headerRow = [], ...dataRows] = table;

  const columnIndex = findColumns(headerRow);
  const missing = REQUIRED_IMPORT_COLUMNS.filter((key) => !columnIndex.has(key));
  if (missing.length > 0) {
    return {
      ok: false,
      message: `The file is missing ${missing.length === 1 ? 'the column' : 'these columns'}: ${missing.map(importColumnHeader).join(', ')}. Download the template to see the expected columns.`,
    };
  }

  const rows: ImportRequest['rows'] = [];
  dataRows.forEach((cells, index) => {
    if (cells.every((cell) => String(cell).trim() === '')) return;
    const row: ImportRequest['rows'][number] = { rowNumber: firstRowNumber + index + 1 };
    for (const [key, position] of columnIndex) row[key] = toValue(key, cells[position]);
    rows.push(row);
  });

  if (rows.length === 0) return { ok: false, message: 'The file has no employees in it.' };
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      message: `The file has ${rows.length.toLocaleString('en-US')} employees; the most one file can have is ${MAX_IMPORT_ROWS.toLocaleString('en-US')}. Please split it.`,
    };
  }
  return { ok: true, rows };
}

/** Column key → position, matching headers ignoring letter case and spaces ("hire date" = "Hire Date"). */
function findColumns(headerRow: Cell[]): Map<ImportColumnKey, number> {
  const normalise = (text: string) => text.toLowerCase().replaceAll(/\s+/g, '');
  const positions = new Map<ImportColumnKey, number>();
  headerRow.forEach((cell, position) => {
    const column = IMPORT_COLUMNS.find(
      ({ header }) => normalise(header) === normalise(String(cell)),
    );
    if (column && !positions.has(column.key)) positions.set(column.key, position);
  });
  return positions;
}

/** Excel stores dates as day numbers (46000 = a day in 2025); turn those into YYYY-MM-DD text. */
function toValue(key: ImportColumnKey, cell: Cell | undefined): string | number {
  if (cell === undefined || typeof cell === 'boolean') return String(cell ?? '');
  if (key === 'hireDate' && typeof cell === 'number') {
    const { y, m, d } = SSF.parse_date_code(cell);
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return cell;
}

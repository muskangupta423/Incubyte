/**
 * Employee codes (EMP-00042) are assigned by the system, never typed by HR:
 * no guessing which codes are free, and no clashes.
 *
 * The next number comes from a counter in the `sequences` table that only ever goes up,
 * so a code is never reused — even after the most recent employee is deleted.
 */
export const EMPLOYEE_CODE_PREFIX = 'EMP-';
const EMPLOYEE_CODE_DIGITS = 5;
const SEQUENCE_NAME = 'employee_code';

/** 42 → "EMP-00042" (more digits are added automatically after 99999). */
export function formatEmployeeCode(sequence: number): string {
  return `${EMPLOYEE_CODE_PREFIX}${String(sequence).padStart(EMPLOYEE_CODE_DIGITS, '0')}`;
}

/** Highest number already used in an EMP-… code (0 when there are none). */
const HIGHEST_CODE_NUMBER_SQL = `
  SELECT COALESCE(MAX(CAST(substr(employee_code, ${EMPLOYEE_CODE_PREFIX.length + 1}) AS INTEGER)), 0)
  FROM employees
  WHERE employee_code LIKE '${EMPLOYEE_CODE_PREFIX}%'`;

/**
 * Makes sure the counter exists and is at least the highest code in the data.
 * Runs on every start (and after seeding); it never moves the counter backwards.
 */
export const SYNC_EMPLOYEE_CODE_SEQUENCE_SQL = `
  INSERT INTO sequences (name, last_value)
  VALUES ('${SEQUENCE_NAME}', (${HIGHEST_CODE_NUMBER_SQL}))
  ON CONFLICT (name) DO UPDATE SET last_value = MAX(last_value, excluded.last_value)`;

export const RESET_EMPLOYEE_CODE_SEQUENCE_SQL = `DELETE FROM sequences WHERE name = '${SEQUENCE_NAME}'`;

/** Step 1 of adding an employee: take the next number. */
export const ADVANCE_EMPLOYEE_CODE_SEQUENCE_SQL = `
  UPDATE sequences SET last_value = last_value + 1 WHERE name = '${SEQUENCE_NAME}'`;

/** Step 2: the code for the number just taken (used inside the INSERT). */
export const CURRENT_EMPLOYEE_CODE_SQL = `
  SELECT printf('${EMPLOYEE_CODE_PREFIX}%0${EMPLOYEE_CODE_DIGITS}d', last_value)
  FROM sequences WHERE name = '${SEQUENCE_NAME}'`;

/**
 * Bulk version (imports): take the next `?` numbers in one statement…
 */
export const RESERVE_EMPLOYEE_CODES_SQL = `
  UPDATE sequences SET last_value = last_value + ? WHERE name = '${SEQUENCE_NAME}'`;

/**
 * …then each new row takes one of them: the code `?` numbers before the last one reserved
 * (0 = the last). Used as a value inside a multi-row INSERT, in the same transaction.
 */
export const RESERVED_EMPLOYEE_CODE_SQL = `(
  SELECT printf('${EMPLOYEE_CODE_PREFIX}%0${EMPLOYEE_CODE_DIGITS}d', last_value - ?)
  FROM sequences WHERE name = '${SEQUENCE_NAME}')`;

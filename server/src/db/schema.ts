/**
 * Database schema. Every statement is idempotent (IF NOT EXISTS), so it is safe to run on every start.
 *
 * Notes:
 * - STRICT tables make SQLite reject values of the wrong type (by default it would store them).
 * - Money is stored as INTEGER whole units of the local currency, never as floating point.
 * - Dates are ISO-8601 text (SQLite has no date type); ISO strings sort correctly.
 */
export const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS exchange_rates (
    currency   TEXT PRIMARY KEY CHECK (length(currency) = 3),
    usd_rate   REAL NOT NULL CHECK (usd_rate > 0),   -- value of 1 unit of this currency in USD
    as_of_date TEXT NOT NULL
  ) STRICT`,

  `CREATE TABLE IF NOT EXISTS employees (
    id            INTEGER PRIMARY KEY,
    employee_code TEXT NOT NULL UNIQUE,
    full_name     TEXT NOT NULL CHECK (length(trim(full_name)) > 0),
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    job_title     TEXT NOT NULL,
    department    TEXT NOT NULL,
    country       TEXT NOT NULL CHECK (length(country) = 2),
    currency      TEXT NOT NULL REFERENCES exchange_rates (currency),
    annual_salary INTEGER NOT NULL CHECK (annual_salary > 0),
    hire_date     TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  ) STRICT`,

  // Countries ACME employs people in (added from the app). Names come from Intl, so only the code
  // and the currency are stored. An employee's country is checked against this table when saved.
  `CREATE TABLE IF NOT EXISTS countries (
    code     TEXT PRIMARY KEY CHECK (length(code) = 2),
    currency TEXT NOT NULL REFERENCES exchange_rates (currency)
  ) STRICT`,

  // Counters that only go up (e.g. the number in the next employee code). See employee-code.ts.
  `CREATE TABLE IF NOT EXISTS sequences (
    name       TEXT PRIMARY KEY,
    last_value INTEGER NOT NULL CHECK (last_value >= 0)
  ) STRICT`,

  // Filters and insights group by these columns.
  // (country, job_title) also serves "country only" lookups, so no separate country index is needed.
  `CREATE INDEX IF NOT EXISTS idx_employees_country_job_title ON employees (country, job_title)`,
  `CREATE INDEX IF NOT EXISTS idx_employees_department ON employees (department)`,
  `CREATE INDEX IF NOT EXISTS idx_employees_job_title ON employees (job_title)`,
  `CREATE INDEX IF NOT EXISTS idx_employees_annual_salary ON employees (annual_salary)`,
];

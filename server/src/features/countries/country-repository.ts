import type { Country } from '@acme/shared';
import type { InStatement, Row } from '@libsql/client';
import type { Database } from '../../db/client';

export async function findCountries(db: Database): Promise<Country[]> {
  const result = await db.execute('SELECT code, currency FROM countries');
  return result.rows.map(toCountry);
}

export async function findCountry(db: Database, code: string): Promise<Country | null> {
  const result = await db.execute({
    sql: 'SELECT code, currency FROM countries WHERE code = ?',
    args: [code],
  });
  const row = result.rows[0];
  return row ? toCountry(row) : null;
}

export async function hasExchangeRate(db: Database, currency: string): Promise<boolean> {
  const result = await db.execute({
    sql: 'SELECT 1 FROM exchange_rates WHERE currency = ?',
    args: [currency],
  });
  return result.rows.length > 0;
}

export interface NewExchangeRate {
  usdRate: number;
  asOfDate: string;
}

/** Adds the country — and its currency's exchange rate, when the currency is new — in one transaction. */
export async function insertCountry(
  db: Database,
  country: Country,
  newRate: NewExchangeRate | undefined,
): Promise<void> {
  const statements: InStatement[] = [];
  if (newRate) {
    statements.push({
      sql: 'INSERT INTO exchange_rates (currency, usd_rate, as_of_date) VALUES (?, ?, ?)',
      args: [country.currency, newRate.usdRate, newRate.asOfDate],
    });
  }
  statements.push({
    sql: 'INSERT INTO countries (code, currency) VALUES (?, ?)',
    args: [country.code, country.currency],
  });
  await db.batch(statements, 'write');
}

function toCountry(row: Row): Country {
  return { code: String(row.code), currency: String(row.currency) };
}

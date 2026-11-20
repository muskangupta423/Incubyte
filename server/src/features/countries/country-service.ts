import {
  countryName,
  currencyOf,
  sortByCountryName,
  type AddCountryInput,
  type Country,
} from '@acme/shared';
import type { Database } from '../../db/client';
import { ConflictError, ValidationError } from '../../http/errors';
import { findCountries, findCountry, hasExchangeRate, insertCountry } from './country-repository';

/** Countries ACME employs people in, A→Z by name. */
export async function listCountries(db: Database): Promise<Country[]> {
  const countries = await findCountries(db);
  const byCode = new Map(countries.map((country) => [country.code, country]));
  return sortByCountryName([...byCode.keys()]).flatMap((code) => byCode.get(code) ?? []);
}

/**
 * Sets up a new country. Its currency comes from the world list. If no country uses that currency
 * yet, HR must give its exchange rate (needed to compare pay in USD); an existing rate is never
 * changed here, because that would silently change every existing employee's USD salary.
 */
export async function addCountry(db: Database, input: AddCountryInput): Promise<Country> {
  const currency = currencyOf(input.code);
  if (!currency) {
    // The input schema already rejects unknown codes; this keeps the types honest.
    throw new ValidationError([{ field: 'code', message: 'Choose a country from the list' }]);
  }
  if (await findCountry(db, input.code)) {
    throw new ConflictError(`${countryName(input.code)} is already set up.`);
  }

  const rateIsKnown = await hasExchangeRate(db, currency);
  if (!rateIsKnown && input.usdRate === undefined) {
    throw new ValidationError([
      { field: 'usdRate', message: `Enter how many US dollars 1 ${currency} is worth` },
    ]);
  }

  const country = { code: input.code, currency };
  const newRate =
    rateIsKnown || input.usdRate === undefined
      ? undefined
      : { usdRate: input.usdRate, asOfDate: today() };
  await insertCountry(db, country, newRate);
  return country;
}

/**
 * The currency employees in this country are paid in. Business rule: only set-up countries can be
 * used, so a typo or an unexpected country in a form or file is caught here.
 */
export async function requireCountryCurrency(db: Database, code: string): Promise<string> {
  const country = await findCountry(db, code);
  if (!country) {
    throw new ValidationError([
      {
        field: 'country',
        message: `${countryName(code)} isn't set up yet — add it as a new country first`,
      },
    ]);
  }
  return country.currency;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

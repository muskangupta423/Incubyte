/**
 * Countries ACME employs people in. Each country pays in exactly one currency
 * (see requirements), so the currency is derived from the country, never entered separately.
 * Adding a country = add it here and add its exchange rate to the database.
 */
export const COUNTRY_CODES = ['US', 'IN', 'GB', 'DE', 'CA', 'AU', 'SG', 'BR'] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export interface Country {
  name: string;
  currency: string;
}

export const COUNTRIES: Record<CountryCode, Country> = {
  US: { name: 'United States', currency: 'USD' },
  IN: { name: 'India', currency: 'INR' },
  GB: { name: 'United Kingdom', currency: 'GBP' },
  DE: { name: 'Germany', currency: 'EUR' },
  CA: { name: 'Canada', currency: 'CAD' },
  AU: { name: 'Australia', currency: 'AUD' },
  SG: { name: 'Singapore', currency: 'SGD' },
  BR: { name: 'Brazil', currency: 'BRL' },
};

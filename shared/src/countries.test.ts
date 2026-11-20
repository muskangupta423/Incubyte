import { describe, expect, it } from 'vitest';
import {
  addCountrySchema,
  countryCodeSchema,
  countryName,
  currencyName,
  currencyOf,
  sortByCountryName,
} from './countries';

describe('countries', () => {
  it('knows the currency people are paid in, for any real country', () => {
    expect(currencyOf('IN')).toBe('INR');
    expect(currencyOf('FR')).toBe('EUR');
    expect(currencyOf('KE')).toBe('KES');
    expect(currencyOf('XX')).toBeUndefined();
    // Not fooled by built-in object keys.
    expect(currencyOf('constructor')).toBeUndefined();
  });

  it('names countries and currencies in English', () => {
    expect(countryName('KE')).toBe('Kenya');
    expect(currencyName('KES')).toBe('Kenyan Shilling');
  });

  it('sorts country codes by name', () => {
    expect(sortByCountryName(['US', 'IN', 'DE'])).toEqual(['DE', 'IN', 'US']);
  });

  it('accepts any real country code, in any letter case', () => {
    expect(countryCodeSchema.parse(' ke ')).toBe('KE');
    expect(countryCodeSchema.safeParse('XX').error?.issues[0]?.message).toBe(
      'Choose a country from the list',
    );
  });

  it.each([
    [{ code: 'KE', usdRate: 0 }, 'Exchange rate must be greater than 0'],
    [{ code: 'KE', usdRate: 20_000 }, 'Exchange rate looks too large — please check it'],
    [{ code: 'KE', usdRate: '0.0077' }, 'Exchange rate must be a number'],
  ])('rejects an invalid exchange rate: %j', (input, message) => {
    expect(addCountrySchema.safeParse(input).error?.issues[0]?.message).toBe(message);
  });
});

import { insightsFilterSchema } from '@acme/shared';
import { describe, expect, it } from 'vitest';
import { parseSearchParams } from './search-params';

describe('parseSearchParams', () => {
  it('parses and normalises valid values', () => {
    const params = new URLSearchParams('country=in&department=Sales');

    expect(parseSearchParams(insightsFilterSchema, params)).toEqual({
      country: 'IN',
      department: 'Sales',
    });
  });

  it('drops only the invalid values', () => {
    const params = new URLSearchParams('country=XX&department=Sales');

    expect(parseSearchParams(insightsFilterSchema, params)).toEqual({ department: 'Sales' });
  });
});

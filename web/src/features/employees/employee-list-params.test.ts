import { describe, expect, it } from 'vitest';
import { parseListParams, toListSearchParams } from './employee-list-params';

describe('parseListParams', () => {
  it('uses defaults for an empty URL', () => {
    expect(parseListParams(new URLSearchParams())).toEqual({
      page: 1,
      pageSize: 25,
      sortBy: 'fullName',
      sortOrder: 'asc',
    });
  });

  it('keeps valid values and drops only the invalid ones', () => {
    const query = parseListParams(
      new URLSearchParams('page=abc&country=in&pageSize=9999&search=asha'),
    );

    expect(query).toMatchObject({ page: 1, pageSize: 25, country: 'IN', search: 'asha' });
  });
});

describe('toListSearchParams', () => {
  it('writes only non-default values, in a fixed order', () => {
    const params = toListSearchParams({
      page: 2,
      pageSize: 25,
      sortBy: 'annualSalary',
      sortOrder: 'desc',
      country: 'IN',
      search: 'asha',
    });

    expect(params.toString()).toBe(
      'search=asha&country=IN&sortBy=annualSalary&sortOrder=desc&page=2',
    );
  });

  it('gives the default list a clean URL', () => {
    expect(toListSearchParams(parseListParams(new URLSearchParams())).toString()).toBe('');
  });
});

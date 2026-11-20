import { describe, expect, it } from 'vitest';
import { formatCompactUsd, formatDate, formatMoney, formatNumber, formatPercent } from './format';

describe('format', () => {
  it('formats money in whole units with the currency symbol', () => {
    expect(formatMoney(2_500_000, 'INR')).toBe('₹2,500,000');
    expect(formatMoney(65_000.4, 'USD')).toBe('$65,000');
    expect(formatMoney(70_000, 'EUR')).toBe('€70,000');
  });

  it('formats counts with thousands separators', () => {
    expect(formatNumber(10_000)).toBe('10,000');
  });

  it('formats large USD amounts compactly and ratios as percentages', () => {
    expect(formatCompactUsd(713_820_637)).toBe('$713.8M');
    expect(formatCompactUsd(63_800)).toBe('$63.8K');
    expect(formatPercent(0.5247)).toBe('52.5%');
  });

  it('formats an ISO date as the same calendar day in every time zone', () => {
    expect(formatDate('2022-04-01')).toBe('Apr 1, 2022');
  });
});

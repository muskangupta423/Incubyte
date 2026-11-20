/**
 * Display formatting. Intl formatters are relatively expensive to create,
 * so one is created per currency and reused for every row.
 */
const LOCALE = 'en-US';

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** 2500000, "INR" → "₹2,500,000" (whole units, no decimals). */
export function formatMoney(amount: number, currency: string): string {
  let formatter = moneyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
    moneyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

const numberFormatter = new Intl.NumberFormat(LOCALE);

/** 10000 → "10,000" */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

// timeZone UTC: "2022-04-01" is a calendar date; without it, users west of UTC would see 31 Mar.
const dateFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeZone: 'UTC' });

/** "2022-04-01" → "Apr 1, 2022" */
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(isoDate));
}

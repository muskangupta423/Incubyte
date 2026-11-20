import { z } from 'zod';

/**
 * Every country HR can choose from, mapped to the one currency people there are paid in
 * (ISO 3166-1 country code → ISO 4217 currency code). Names are not stored here: they come from
 * the browser/Node built-in Intl.DisplayNames, so they are always spelled correctly.
 *
 * Which countries ACME actually employs people in is data, not code: the `countries` table
 * (added from the Add employee form). This list only makes adding one quick and typo-free.
 * Uninhabited territories (e.g. Antarctica) are left out.
 */
// prettier-ignore
export const WORLD_CURRENCIES: Readonly<Record<string, string>> = {
  AD: 'EUR', AE: 'AED', AF: 'AFN', AG: 'XCD', AI: 'XCD', AL: 'ALL', AM: 'AMD', AO: 'AOA', AR: 'ARS',
  AS: 'USD', AT: 'EUR', AU: 'AUD', AW: 'AWG', AX: 'EUR', AZ: 'AZN', BA: 'BAM', BB: 'BBD', BD: 'BDT',
  BE: 'EUR', BF: 'XOF', BG: 'EUR', BH: 'BHD', BI: 'BIF', BJ: 'XOF', BL: 'EUR', BM: 'BMD', BN: 'BND',
  BO: 'BOB', BQ: 'USD', BR: 'BRL', BS: 'BSD', BT: 'BTN', BW: 'BWP', BY: 'BYN', BZ: 'BZD', CA: 'CAD',
  CC: 'AUD', CD: 'CDF', CF: 'XAF', CG: 'XAF', CH: 'CHF', CI: 'XOF', CK: 'NZD', CL: 'CLP', CM: 'XAF',
  CN: 'CNY', CO: 'COP', CR: 'CRC', CU: 'CUP', CV: 'CVE', CW: 'XCG', CX: 'AUD', CY: 'EUR', CZ: 'CZK',
  DE: 'EUR', DJ: 'DJF', DK: 'DKK', DM: 'XCD', DO: 'DOP', DZ: 'DZD', EC: 'USD', EE: 'EUR', EG: 'EGP',
  EH: 'MAD', ER: 'ERN', ES: 'EUR', ET: 'ETB', FI: 'EUR', FJ: 'FJD', FK: 'FKP', FM: 'USD', FO: 'DKK',
  FR: 'EUR', GA: 'XAF', GB: 'GBP', GD: 'XCD', GE: 'GEL', GF: 'EUR', GG: 'GBP', GH: 'GHS', GI: 'GIP',
  GL: 'DKK', GM: 'GMD', GN: 'GNF', GP: 'EUR', GQ: 'XAF', GR: 'EUR', GT: 'GTQ', GU: 'USD', GW: 'XOF',
  GY: 'GYD', HK: 'HKD', HN: 'HNL', HR: 'EUR', HT: 'HTG', HU: 'HUF', ID: 'IDR', IE: 'EUR', IL: 'ILS',
  IM: 'GBP', IN: 'INR', IO: 'USD', IQ: 'IQD', IR: 'IRR', IS: 'ISK', IT: 'EUR', JE: 'GBP', JM: 'JMD',
  JO: 'JOD', JP: 'JPY', KE: 'KES', KG: 'KGS', KH: 'KHR', KI: 'AUD', KM: 'KMF', KN: 'XCD', KP: 'KPW',
  KR: 'KRW', KW: 'KWD', KY: 'KYD', KZ: 'KZT', LA: 'LAK', LB: 'LBP', LC: 'XCD', LI: 'CHF', LK: 'LKR',
  LR: 'LRD', LS: 'LSL', LT: 'EUR', LU: 'EUR', LV: 'EUR', LY: 'LYD', MA: 'MAD', MC: 'EUR', MD: 'MDL',
  ME: 'EUR', MF: 'EUR', MG: 'MGA', MH: 'USD', MK: 'MKD', ML: 'XOF', MM: 'MMK', MN: 'MNT', MO: 'MOP',
  MP: 'USD', MQ: 'EUR', MR: 'MRU', MS: 'XCD', MT: 'EUR', MU: 'MUR', MV: 'MVR', MW: 'MWK', MX: 'MXN',
  MY: 'MYR', MZ: 'MZN', NA: 'NAD', NC: 'XPF', NE: 'XOF', NF: 'AUD', NG: 'NGN', NI: 'NIO', NL: 'EUR',
  NO: 'NOK', NP: 'NPR', NR: 'AUD', NU: 'NZD', NZ: 'NZD', OM: 'OMR', PA: 'USD', PE: 'PEN', PF: 'XPF',
  PG: 'PGK', PH: 'PHP', PK: 'PKR', PL: 'PLN', PM: 'EUR', PN: 'NZD', PR: 'USD', PS: 'ILS', PT: 'EUR',
  PW: 'USD', PY: 'PYG', QA: 'QAR', RE: 'EUR', RO: 'RON', RS: 'RSD', RU: 'RUB', RW: 'RWF', SA: 'SAR',
  SB: 'SBD', SC: 'SCR', SD: 'SDG', SE: 'SEK', SG: 'SGD', SH: 'SHP', SI: 'EUR', SJ: 'NOK', SK: 'EUR',
  SL: 'SLE', SM: 'EUR', SN: 'XOF', SO: 'SOS', SR: 'SRD', SS: 'SSP', ST: 'STN', SV: 'USD', SX: 'XCG',
  SY: 'SYP', SZ: 'SZL', TC: 'USD', TD: 'XAF', TF: 'EUR', TG: 'XOF', TH: 'THB', TJ: 'TJS', TK: 'NZD',
  TL: 'USD', TM: 'TMT', TN: 'TND', TO: 'TOP', TR: 'TRY', TT: 'TTD', TV: 'AUD', TW: 'TWD', TZ: 'TZS',
  UA: 'UAH', UG: 'UGX', UM: 'USD', US: 'USD', UY: 'UYU', UZ: 'UZS', VA: 'EUR', VC: 'XCD', VE: 'VES',
  VG: 'USD', VI: 'USD', VN: 'VND', VU: 'VUV', WF: 'XPF', WS: 'WST', XK: 'EUR', YE: 'YER', YT: 'EUR',
  ZA: 'ZAR', ZM: 'ZMW', ZW: 'ZWG',
};

/** A country ACME employs people in (a row of the `countries` table). */
export interface Country {
  code: string;
  currency: string;
}

/** The currency people in this country are paid in, or undefined for an unknown code. */
export function currencyOf(code: string): string | undefined {
  return Object.hasOwn(WORLD_CURRENCIES, code) ? WORLD_CURRENCIES[code] : undefined;
}

// Created once: building a DisplayNames object is relatively slow, looking names up is fast.
const regionNames = new Intl.DisplayNames(['en'], { type: 'region', fallback: 'code' });
const currencyNames = new Intl.DisplayNames(['en'], { type: 'currency', fallback: 'code' });

/** "IN" → "India". Unknown codes are shown as-is rather than hidden. */
export function countryName(code: string): string {
  return regionNames.of(code) ?? code;
}

/** "KES" → "Kenyan Shilling". */
export function currencyName(currency: string): string {
  return currencyNames.of(currency) ?? currency;
}

const codesByLowerCaseName = new Map(
  Object.keys(WORLD_CURRENCIES).map((code) => [countryName(code).toLowerCase(), code]),
);

/**
 * "India", "india" or "IN" → "IN" (for spreadsheets, where people type names). Anything else is
 * returned unchanged, so validation can report it as typed.
 */
export function countryCodeFromInput(value: string): string {
  const trimmed = value.trim();
  if (currencyOf(trimmed.toUpperCase())) return trimmed.toUpperCase();
  return codesByLowerCaseName.get(trimmed.toLowerCase()) ?? trimmed;
}

/** Country codes sorted by their names, for dropdowns. */
export function sortByCountryName(codes: readonly string[]): string[] {
  return [...codes].sort((a, b) => countryName(a).localeCompare(countryName(b)));
}

/**
 * Accepts "in", " IN " etc. and returns "IN". Only real countries pass here; whether ACME has
 * set the country up is checked by the API against the database.
 */
export const countryCodeSchema = z
  .string('Choose a country')
  .trim()
  .toUpperCase()
  .min(1, { error: 'Choose a country', abort: true })
  .refine((code) => currencyOf(code) !== undefined, 'Choose a country from the list');

/** Highest rate accepted: 1 unit of a currency worth more than this many USD is surely a typo. */
const MAX_USD_RATE = 10_000;

export const addCountrySchema = z.object({
  code: countryCodeSchema,
  /** Value of 1 unit of the country's currency in USD. Needed only if no country uses it yet. */
  usdRate: z
    .number('Exchange rate must be a number')
    .positive('Exchange rate must be greater than 0')
    .max(MAX_USD_RATE, 'Exchange rate looks too large — please check it')
    .optional(),
});

export type AddCountryInput = z.infer<typeof addCountrySchema>;

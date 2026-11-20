import { z } from 'zod';
import { COUNTRY_CODES } from './countries';

/** Accepts "in", " IN " etc. and returns "IN"; only supported countries pass. */
export const countryCode = z
  .string()
  .trim()
  .toUpperCase()
  .pipe(z.enum(COUNTRY_CODES, 'Choose a supported country'));

/** Query strings send "" for cleared inputs; treat that the same as "not provided". */
export const optionalFilter = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

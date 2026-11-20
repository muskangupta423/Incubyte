import { z } from 'zod';

/** Query strings send "" for cleared inputs; treat that the same as "not provided". */
export const optionalFilter = <Schema extends z.ZodType>(schema: Schema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

import { addCountrySchema } from '@acme/shared';
import { Router } from 'express';
import type { Database } from '../../db/client';
import { parseInput } from '../../http/validation';
import { addCountry, listCountries } from './country-service';

/** HTTP layer only: validate input, call the service, choose the status code. */
export function createCountryRouter(db: Database): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    res.json(await listCountries(db));
  });

  router.post('/', async (req, res) => {
    const input = parseInput(addCountrySchema, req.body);
    res.status(201).json(await addCountry(db, input));
  });

  return router;
}

import { importRequestSchema } from '@acme/shared';
import { Router } from 'express';
import type { Database } from '../../db/client';
import { parseInput } from '../../http/validation';
import { checkImport, runImport } from './import-service';

/** HTTP layer only: validate input, call the service, choose the status code. */
export function createImportRouter(db: Database): Router {
  const router = Router();

  // Checks the file and reports what would happen; saves nothing.
  router.post('/check', async (req, res) => {
    res.json(await checkImport(db, parseInput(importRequestSchema, req.body)));
  });

  router.post('/', async (req, res) => {
    res.json(await runImport(db, parseInput(importRequestSchema, req.body)));
  });

  return router;
}

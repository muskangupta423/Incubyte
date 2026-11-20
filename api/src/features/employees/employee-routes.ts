import { employeeListQuerySchema } from '@acme/shared';
import { Router } from 'express';
import type { Database } from '../../db/client';
import { parseInput } from '../../http/validation';
import { listEmployees } from './employee-service';

export function createEmployeeRouter(db: Database): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const query = parseInput(employeeListQuerySchema, req.query);
    res.json(await listEmployees(db, query));
  });

  return router;
}

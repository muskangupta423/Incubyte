import {
  bulkDeleteEmployeesSchema,
  employeeExportQuerySchema,
  employeeInputSchema,
  employeeListQuerySchema,
} from '@acme/shared';
import { Router } from 'express';
import { z } from 'zod';
import type { Database } from '../../db/client';
import { parseInput } from '../../http/validation';
import {
  createEmployee,
  deleteEmployee,
  deleteEmployees,
  exportEmployees,
  getEmployee,
  getFilterOptions,
  listEmployees,
  updateEmployee,
} from './employee-service';

const employeeIdParamsSchema = z.object({
  id: z.coerce.number().int().positive('Employee id must be a positive whole number'),
});

/** HTTP layer only: validate input, call the service, choose the status code. */
export function createEmployeeRouter(db: Database): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    const query = parseInput(employeeListQuerySchema, req.query);
    res.json(await listEmployees(db, query));
  });

  // Registered before '/:id', otherwise Express would treat "filter-options" as an id.
  router.get('/filter-options', async (_req, res) => {
    res.json(await getFilterOptions(db));
  });

  // Like filter-options: registered before '/:id'.
  router.get('/export', async (req, res) => {
    const query = parseInput(employeeExportQuerySchema, req.query);
    res.json(await exportEmployees(db, query));
  });

  router.get('/:id', async (req, res) => {
    const { id } = parseInput(employeeIdParamsSchema, req.params);
    res.json(await getEmployee(db, id));
  });

  router.post('/', async (req, res) => {
    const input = parseInput(employeeInputSchema, req.body);
    const employee = await createEmployee(db, input);
    res.status(201).location(`${req.baseUrl}/${employee.id}`).json(employee);
  });

  // POST, not DELETE: a list of ids belongs in a request body, which DELETE requests don't reliably carry.
  router.post('/bulk-delete', async (req, res) => {
    const { ids } = parseInput(bulkDeleteEmployeesSchema, req.body);
    res.json(await deleteEmployees(db, ids));
  });

  router.put('/:id', async (req, res) => {
    const { id } = parseInput(employeeIdParamsSchema, req.params);
    const input = parseInput(employeeInputSchema, req.body);
    res.json(await updateEmployee(db, id, input));
  });

  router.delete('/:id', async (req, res) => {
    const { id } = parseInput(employeeIdParamsSchema, req.params);
    await deleteEmployee(db, id);
    res.status(204).end();
  });

  return router;
}

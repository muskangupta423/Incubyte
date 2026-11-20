import { insightsFilterSchema, type InsightsFilter } from '@acme/shared';
import { Router, type RequestHandler } from 'express';
import type { Database } from '../../db/client';
import { parseInput } from '../../http/validation';
import {
  getByCountry,
  getByDepartment,
  getByJobTitle,
  getSalaryDistribution,
  getSummary,
} from './insights-service';

/** Every insights endpoint accepts the same optional filters: ?country=&department= */
export function createInsightsRouter(db: Database): Router {
  const router = Router();

  const respondWith =
    (getInsight: (db: Database, filters: InsightsFilter) => Promise<unknown>): RequestHandler =>
    async (req, res) => {
      const filters = parseInput(insightsFilterSchema, req.query);
      res.json(await getInsight(db, filters));
    };

  router.get('/summary', respondWith(getSummary));
  router.get('/by-country', respondWith(getByCountry));
  router.get('/by-department', respondWith(getByDepartment));
  router.get('/by-job-title', respondWith(getByJobTitle));
  router.get('/distribution', respondWith(getSalaryDistribution));

  return router;
}

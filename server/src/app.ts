import express from 'express';
import type { Database } from './db/client';
import { createCountryRouter } from './features/countries/country-routes';
import { createImportRouter } from './features/employee-import/import-routes';
import { createEmployeeRouter } from './features/employees/employee-routes';
import { createInsightsRouter } from './features/insights/insights-routes';
import { errorHandler, notFoundHandler } from './http/error-handler';

const IMPORT_BODY_LIMIT = '4mb';

interface AppDependencies {
  db: Database;
}

/**
 * Builds the Express app without starting a server,
 * so tests can call it directly with Supertest and pass in a test database.
 */
export function createApp({ db }: AppDependencies) {
  const app = express();

  // Uploads carry a whole spreadsheet (10,000 rows ≈ 2 MB), so they get a bigger body limit —
  // only they do. Mounted before the general parser, which would reject them at 100 kB.
  // (Vercel itself accepts request bodies up to 4.5 MB.)
  app.use(
    '/api/employees/import',
    express.json({ limit: IMPORT_BODY_LIMIT }),
    createImportRouter(db),
  );
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/countries', createCountryRouter(db));
  app.use('/api/employees', createEmployeeRouter(db));
  app.use('/api/insights', createInsightsRouter(db));

  // Must stay last: Express runs these only when nothing above handled the request.
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}

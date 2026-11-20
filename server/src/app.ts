import express from 'express';
import type { Database } from './db/client';
import { createEmployeeRouter } from './features/employees/employee-routes';
import { createInsightsRouter } from './features/insights/insights-routes';
import { errorHandler, notFoundHandler } from './http/error-handler';

interface AppDependencies {
  db: Database;
}

/**
 * Builds the Express app without starting a server,
 * so tests can call it directly with Supertest and pass in a test database.
 */
export function createApp({ db }: AppDependencies) {
  const app = express();

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/employees', createEmployeeRouter(db));
  app.use('/api/insights', createInsightsRouter(db));

  // Must stay last: Express runs these only when nothing above handled the request.
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return app;
}

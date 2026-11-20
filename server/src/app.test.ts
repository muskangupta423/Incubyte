import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { createTestDatabase } from './db/test-database';

describe('app', () => {
  it('reports that the API is up', async () => {
    const app = createApp({ db: await createTestDatabase() });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('answers unknown API routes with a JSON 404', async () => {
    const app = createApp({ db: await createTestDatabase() });

    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { message: 'No API route for GET /api/does-not-exist' },
    });
  });
});

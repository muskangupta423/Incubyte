import type { IncomingMessage, ServerResponse } from 'node:http';
import { createConfiguredApp } from './bootstrap';

/**
 * Production entry point: Vercel runs this as a serverless function for every /api/* request.
 * The app (and database connection) is created on the first request of a function instance
 * — a "cold start" — and reused for the following requests.
 */
let appPromise: ReturnType<typeof createConfiguredApp> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set for this deployment');
    appPromise ??= createConfiguredApp();
    const app = await appPromise;
    app(req, res);
  } catch (error) {
    // Let the next request retry the start-up instead of failing forever.
    appPromise = undefined;
    console.error('API failed to start', error);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: { message: 'The service is starting up or unavailable. Please try again.' },
      }),
    );
  }
}

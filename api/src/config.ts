const DEFAULT_PORT = 3001;
const DEFAULT_DATABASE_URL = 'file:local.db';

/** Runtime settings, read once from environment variables. */
export const config = {
  port: Number(process.env.PORT ?? DEFAULT_PORT),
  database: {
    url: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
    // Only needed for the hosted (Turso) database in production.
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
};

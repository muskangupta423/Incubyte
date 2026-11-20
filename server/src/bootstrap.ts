import { createApp } from './app';
import { config } from './config';
import { openDatabase } from './db/client';
import { migrate } from './db/migrate';

/** Connects to the configured database, brings its schema up to date and builds the app. */
export async function createConfiguredApp() {
  const db = await openDatabase(config.database);
  await migrate(db);
  return createApp({ db });
}

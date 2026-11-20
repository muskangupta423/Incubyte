import { createApp } from './app';
import { config } from './config';
import { openDatabase } from './db/client';
import { migrate } from './db/migrate';

const db = await openDatabase(config.database);
await migrate(db);

createApp({ db }).listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

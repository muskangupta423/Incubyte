import { config } from '../../config';
import { openDatabase } from '../client';
import { migrate } from '../migrate';
import { generateEmployees } from './generate-employees';
import { seedDatabase } from './seed-database';

/** Command-line entry: `npm run seed`. Replaces ALL employees in the configured database. */
const EMPLOYEE_COUNT = 10_000;
const RANDOM_SEED = 42;

const startedAt = performance.now();

const db = await openDatabase(config.database);
await migrate(db);
await seedDatabase(db, generateEmployees(EMPLOYEE_COUNT, RANDOM_SEED));

const seconds = ((performance.now() - startedAt) / 1000).toFixed(2);
console.log(`Seeded ${EMPLOYEE_COUNT} employees into ${config.database.url} in ${seconds}s`);

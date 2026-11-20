import { createConfiguredApp } from './bootstrap';
import { config } from './config';

/** Local development server: `npm run dev:api`. (Production runs src/vercel.ts instead.) */
const app = await createConfiguredApp();

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

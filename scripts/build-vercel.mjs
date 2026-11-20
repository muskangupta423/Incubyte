/**
 * Builds the whole app in Vercel's "Build Output API" format (.vercel/output), so what Vercel
 * deploys is exactly what we build and can test locally:
 *
 *   .vercel/output/static/          the React app (Vite build)
 *   .vercel/output/functions/api.func/  the Express API bundled into one file (esbuild)
 *   .vercel/output/config.json      routing: files first, /api/* → function, everything else → index.html
 *
 * Docs: https://vercel.com/docs/build-output-api/v3
 */
import { execSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const OUTPUT = '.vercel/output';
const FUNCTION_DIR = `${OUTPUT}/functions/api.func`;
const NODE_RUNTIME = 'nodejs22.x';

rmSync(OUTPUT, { recursive: true, force: true });

console.log('1/3 Building the web app…');
execSync('npm run build --workspace web', { stdio: 'inherit' });
cpSync('web/dist', `${OUTPUT}/static`, { recursive: true });

console.log('2/3 Bundling the API into one serverless function…');
await build({
  entryPoints: ['api/src/vercel.ts'],
  // .cjs: the root package.json says "type": "module", so a .js file would be read as an ES module.
  outfile: `${FUNCTION_DIR}/index.cjs`,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  sourcemap: true,
  // The full libSQL client (native SQLite engine) is only used for local files, never on Vercel,
  // which uses the bundled pure-JavaScript web client for the hosted database.
  external: ['@libsql/client'],
  logLevel: 'warning',
});
writeJson(`${FUNCTION_DIR}/.vc-config.json`, {
  runtime: NODE_RUNTIME,
  handler: 'index.cjs',
  launcherType: 'Nodejs',
  // Let Express read the raw request body itself (express.json()).
  shouldAddHelpers: false,
});

console.log('3/3 Writing routes…');
writeJson(`${OUTPUT}/config.json`, {
  version: 3,
  routes: [
    // Vite puts a content hash in asset file names, so they can be cached "forever".
    {
      src: '^/assets/(.*)$',
      headers: { 'cache-control': 'public, max-age=31536000, immutable' },
      continue: true,
    },
    { handle: 'filesystem' },
    { src: '^/api(/.*)?$', dest: '/api' },
    // Any other path is a page of the single-page app (e.g. /employees?page=3).
    { src: '^/(.*)$', dest: '/index.html' },
  ],
});

console.log(`Done → ${OUTPUT}`);

function writeJson(path, value) {
  mkdirSync(path.slice(0, path.lastIndexOf('/')), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

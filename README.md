# ACME Salary Management

A web app for ACME's HR Manager to **manage salaries of 10,000 employees across countries**
and **understand how the organization pays people** — replacing spreadsheets.

**Live app:** _link added after the first deployment_

## Artifacts (read these first)

| Doc | What's inside |
|-----|---------------|
| [Requirements](docs/01-requirements.md) | Goal, scope, features, what's left out and why |
| [Architecture](docs/02-architecture.md) | Diagrams, layers, data model, API, testing strategy |
| [Decisions & trade-offs](docs/03-decisions.md) | Every key choice with alternatives, plus roadmap |
| [Build plan](docs/04-plan.md) | Step-by-step plan matching the commit history |
| [Performance](docs/05-performance.md) | How the app stays fast with 10,000 employees |
| [AI usage](docs/06-ai-usage.md) | How AI tools were used, the prompts given, and my own review findings |
| [CLAUDE.md](CLAUDE.md) | Engineering standards given to the AI agent (loaded in every session) |

## Run it locally

Requires **Node.js 22+** (see `.nvmrc`).

```bash
npm install
npm run seed       # creates server/local.db with 10,000 employees (same data every run)
npm run dev:api    # API on http://localhost:3001
npm run dev:web    # app on http://localhost:5173 (in a second terminal)
```

No environment variables are needed locally. To start again from clean data, run `npm run seed`.

## Quality checks

```bash
npm test           # all tests (shared, api, web)
npm run typecheck  # strict TypeScript
npm run lint       # ESLint
npm run format:check
```

## Deployment

One Vercel project serves both parts on the same domain:
the React app as static files and the Express API as a single serverless function.
The database is [Turso](https://turso.tech) (hosted SQLite — same SQL as local development).

`npm run build:vercel` writes Vercel's [Build Output](https://vercel.com/docs/build-output-api/v3)
format directly (`.vercel/output`): the web build plus the API bundled into one file with esbuild.
Vercel runs this command automatically (see `vercel.json`).

**Set up once**

1. Create a Turso database and an auth token.
2. Seed it from your machine:
   `DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run seed`
3. Import the GitHub repo in Vercel and add the environment variables `DATABASE_URL` and
   `DATABASE_AUTH_TOKEN` (see `.env.example`).

Every push to `main` then deploys automatically.

## Tech stack

TypeScript · Node.js · Express · SQLite (libSQL / Turso) · Zod · React · Vite · Styled Components · TanStack Query · React Hook Form · Recharts · Vitest · MSW · Vercel

# Decisions & Trade-offs

Each decision: what we chose, what else we considered, and why.

| # | Decision | Alternatives considered | Why this choice | Trade-off we accept |
|---|----------|-------------------------|-----------------|---------------------|
| D1 | **TypeScript on both backend and frontend** | Java/Spring, Python | Role is Node/React/TypeScript; one language means shared mental model and types | — |
| D2 | **Express** for the API | NestJS, Fastify | Small, well known, easy to read; NestJS adds decorators/DI boilerplate not needed at this size | We structure the code ourselves (routes → services → repositories) |
| D3 | **SQLite** (via libSQL) | PostgreSQL, MongoDB | Suggested in the brief; zero setup; 10,000 rows is tiny for SQLite; relational data fits well | Single-writer database — fine for one HR team, not for heavy concurrent writes |
| D4 | **Turso** (hosted SQLite) in production | Postgres on Neon, SQLite file on a VM | Vercel's serverless functions can't keep a local file between requests; Turso speaks the same SQLite dialect, so dev, tests and prod use identical SQL | Extra service to configure (free tier is enough) |
| D5 | **Raw SQL in repositories** | Prisma, Drizzle ORM | Insights are aggregation queries (GROUP BY, percentiles) that are clearer in SQL; fewer moving parts | Hand-written row → object mapping |
| D6 | **Zod** for validation | Joi, class-validator, manual checks | Same schema gives runtime validation and TypeScript types | — |
| D7 | **Styled Components + small in-house components** (Button, Input, Table, Pagination, Dialog…) on central design tokens | MUI, Ant Design, Mantine | Developer's existing expertise; full control over accessibility and look; only the components this app actually reuses are built. *(Initially MUI was proposed; changed after the developer set engineering standards — see [AI usage](06-ai-usage.md).)* | We build table, pagination and dialog ourselves (kept simple: server-side data, no virtualization needed for 25–100 rows per page) |
| D7a | **Recharts** for charts | MUI X Charts, Chart.js | Declarative React components, widely used, simple for bar/histogram charts | Extra dependency only used on the dashboard → lazy-loaded with the dashboard route |
| D7b | **React Hook Form + Zod** for forms | Controlled `useState` forms, Formik | Few re-renders, built-in Zod integration, same schema as the API | — |
| D7c | **Filters, search, sort and page stored in the URL** | Component state | Shareable links, refresh-safe, back button works; one source of truth | Slightly more code to read/write query params |
| D7d | **`shared/` workspace for Zod schemas & API types** | Duplicate types in api and web | Same rule ("salary > 0") in form and API without drift | Small coupling: both apps depend on `shared/` — limited to contracts, never implementation |
| D8 | **Server-side pagination & filtering** | Load all 10,000 rows in the browser | Keeps the page fast and memory-light; scales beyond 10k | Every filter change is a network request (debounced) |
| D9 | **Statistics computed in SQL / service, not in the browser** | Send raw data and compute in React | Less data over the network; logic is unit-testable in one place | — |
| D10 | **Store salary in local currency + fixed USD rate table** | Store everything in USD; live FX API | Matches how people are actually paid; fixed rates make numbers stable and tests deterministic | Rates go stale — date shown in UI, refreshing rates is a roadmap item |
| D11 | **Median as well as average** | Average only | Salaries are skewed — a few high earners pull the average up; median is the fairer "typical" pay | Median is computed in the service (SQLite has no built-in median) |
| D12 | **No authentication** (for now) | Simple login, OAuth | Single persona; time is better spent on salary features and insights | Not production-safe — first roadmap item |
| D13 | **Deterministic seed** (fixed random seed, realistic salary ranges per country & role) | Purely random values | Insights look realistic; the same data every run makes demos and debugging repeatable | — |
| D14 | **npm workspaces monorepo** (`shared/`, `api/`, `web/`) | Two separate repos | One repo for the reviewer; one install command | — |
| D15 | **Excel/CSV import & export in Phase 2** (not left out) | Skip entirely; build first | HR lives in Excel today — without import the product can't actually replace it. Built after Phase 1 so a working, deployed app exists first | Phase 1 relies on seed data only |
| D16 | **Import is all-or-nothing, with a dry-run preview** | Save valid rows, skip bad ones | Partial imports leave HR unsure what got saved; a preview + clear row errors lets them fix the sheet and retry | One bad row blocks the file until fixed |
| D17 | **Match import rows by `employee_code`** (add new, update existing) | Always insert; match by email | Employee code is the stable business ID HR already uses; re-importing the same sheet is safe (no duplicates) | Sheets must include the code column |
| D18 | **Parse files on the server (ExcelJS)** | Parse in the browser | Reuses the same Zod validation as the API; one source of truth for rules | File is uploaded before validation (fine at this size) |
| D19 | **Light salary breakdown: earning components only** (Basic, HRA, Special Allowance…) | No breakdown; full payroll with PF / TDS / LWF | Lets HR record how CTC is structured. Deductions are country-specific tax/payroll rules — a different product. | No take-home pay or tax calculation |
| D20 | **Free-text component names, not a fixed list** | Fixed India-specific list; per-country component templates | ACME is multi-country — "HRA" means nothing in the US. Free text works everywhere with zero configuration. | HR could spell a name two ways ("HRA" vs "Hra"); a per-country template list is the next step |
| D21 | **Components must sum exactly to the annual salary** | Allow any total | Keeps one source of truth: insights use the annual salary, and the breakdown can never contradict it | Changing CTC means updating the breakdown too (UI shows the difference live) |
| D22 | **Breakdown is optional and edited in the UI only** (not in import, not in insights) | Include in Excel import; component-level insights | Keeps Phase 2 small; the import file stays one row per employee | Bulk breakdown changes need the UI for now |

## Roadmap (what we'd do next, in order)

1. Authentication + role-based access (HR Manager, read-only viewer).
2. Salary history & audit log (who changed what, when).
3. Scheduled refresh of exchange rates.
4. Pay-equity insights (e.g. compa-ratio vs. role band).
5. Background jobs for very large imports (100k+ rows).
6. Per-country salary component templates (e.g. India: Basic / HRA / Special Allowance) and component import.
7. Deductions & take-home pay (PF, TDS, etc.) — only if ACME decides this tool should also do payroll.

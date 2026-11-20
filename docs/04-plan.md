# Build Plan

We build in **small vertical steps**. Each step ends with passing tests and a commit,
so the git history shows how the solution evolved.

| Step | What | Done when |
|------|------|-----------|
| | **Phase 1 — Core product** | |
| 0 | Artifacts: requirements, architecture, decisions, plan, performance, AI usage | Docs committed before code |
| 1 | Project setup: npm workspaces (`server/` — first named `api/`, see D24 — and `web/`; `shared/` is added with its first schema), strict TypeScript, Vitest, ESLint + Prettier | `npm test`, `npm run typecheck`, `npm run lint` pass from the root |
| 2 | Database: schema, migrations, connection, exchange-rate table | Integration test creates schema in-memory |
| 3 | Seed script: 10,000 deterministic employees across countries, departments, roles | `npm run seed` fills DB; test checks count & determinism |
| 4 | Employees API: list (pagination, search, filters, sort) | API tests pass |
| 5 | Employees API: create / update / delete with validation | API + unit tests pass |
| 6 | Insights services & API: summary, by country, by job title, by department, distribution | Unit tests for stats math + API tests |
| 7 | Web: design tokens (Incubyte palette), light/dark mode, responsive app shell & routing, first reusable components | Routing, navigation and theme-toggle tests pass (incl. keyboard) |
| 8 | Web: HTTP client + TanStack Query, Employees page — table, search (debounced), filters, sort, pagination, all in the URL; loading / empty / error states | Component tests pass; works against local API |
| 9 | Web: add / edit / delete employee (React Hook Form + shared Zod schema) | Form validation tests pass |
| 10 | Web: Dashboard — stat cards + Recharts charts + country / job-title drill-down | Renders with real data; tests for key states |
| 11 | Performance check: time key API queries on the 10,000-employee DB, record results in [performance](05-performance.md) | Numbers measured, not guessed |
| 12 | Deploy: Turso DB + Vercel (api + web); seed production DB | Public URL works |
| | **Phase 2 — Moving off Excel** | |
| 13 | ✅ Import API: row-level validation and a check step (`/import/check`) — the browser reads the file (see D7aj) | Unit tests for row rules; API tests for every kind of row error |
| 14 | ✅ Import API: save in one transaction, add-or-update by `employee_code`; template download (built in the browser) | API tests: all-or-nothing, consecutive codes, a 10,000-row file |
| 15 | Export API: filtered list as .xlsx / .csv | API test checks columns & row count |
| 16 | ✅ Web: Import dialog (template → choose file → check / problems → import); Export button still to do | Tests upload real .xlsx and .csv files |
| 17 | Salary components API: table, GET / PUT breakdown, "must add up to annual salary" rule; seed a breakdown for some employees | Unit tests for the sum rule; API tests |
| 18 | Web: "Salary breakdown" section on the employee form (add / remove rows, live total vs. annual salary) | Component tests pass |
| 19 | Redeploy, README polish, screenshots, video demo, AI usage notes | Submission ready |

## Definition of done (every step)

The full checklist is in [`CLAUDE.md`](../CLAUDE.md) (section 13). In short:

- Works end-to-end, including loading, empty and error states.
- Tests, type check and lint pass.
- Self-review as a senior PR reviewer (CLAUDE.md section 12) — fix issues before moving on.
- No dead code, no unnecessary abstractions; docs updated.
- Commit message explains *what* and *why*.

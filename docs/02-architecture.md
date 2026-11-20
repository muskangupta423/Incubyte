# Architecture & Design

## 1. Big picture

```mermaid
flowchart LR
    HR([HR Manager]) -->|uses browser| WEB

    subgraph Frontend [web/ — React + Vite + Styled Components]
        WEB[Pages: Employees, Insights]
    end

    subgraph Backend [api/ — Node + Express + TypeScript]
        R[Routes<br/>HTTP in/out] --> S[Services<br/>business rules]
        S --> REPO[Repositories<br/>SQL queries]
    end

    WEB -->|JSON over HTTP /api/...| R
    REPO --> DB[(SQLite<br/>local file / Turso in prod)]
```

In plain words:

- **web/** — what the HR Manager sees and clicks.
- **api/** — receives requests, checks the data, applies rules, talks to the database.
- **Database** — stores employees and exchange rates.

## 2. Backend layers (why 3 layers?)

| Layer | Job | Knows about HTTP? | Knows about SQL? |
|-------|-----|-------------------|------------------|
| **Routes** | Read request, validate input, send response | Yes | No |
| **Services** | Business rules (currency conversion, statistics) | No | No |
| **Repositories** | Run SQL queries | No | Yes |

Each layer only talks to the one below it. This keeps business logic **easy to unit test**
(no server, no database needed) and makes each file small and focused.

## 3. Folder structure

```
/
├── shared/                   Contracts used by BOTH api and web
│   └── src/                  Zod schemas (employee input, query params) + API response types
├── api/                      Backend
│   └── src/
│       ├── features/
│       │   ├── employees/    routes, service, repository, tests
│       │   ├── insights/     routes, service (stats math), repository (aggregation SQL)
│       │   ├── compensation/ salary components (Phase 2)
│       │   └── csv/          Excel/CSV import & export (Phase 2)
│       ├── db/               connection, schema/migrations, seed
│       ├── http/             error handler, validation middleware, error types
│       └── app.ts            Express app (exported for tests)
├── web/                      Frontend
│   └── src/
│       ├── app/              App entry, routing, providers (QueryClient, Theme)
│       ├── components/       Reusable UI: Button, Input, Select, Table, Pagination, Dialog, StatCard...
│       ├── features/
│       │   ├── employees/    list page, form, API hooks, filters
│       │   ├── dashboard/    insights page, charts, API hooks
│       │   ├── compensation/ salary breakdown editor (Phase 2)
│       │   └── csv/          import dialog, export button (Phase 2)
│       ├── services/         HTTP client (one place for fetch + error handling)
│       ├── theme/            design tokens (colors, spacing, typography...) + global styles
│       └── utils/            pure helpers (e.g. currency formatting)
└── docs/                     These artifacts
```

- Code is grouped **by feature**, so everything about employees lives in `features/employees/` on both sides.
- Folders are created only when they are needed — no empty placeholders.
- `shared/` exists because the **same validation rules** (e.g. "salary must be > 0") are needed in the API and in the form. One schema, no drift.

## Frontend state — where each kind of data lives

| Kind of state | Example | Where it lives |
|---------------|---------|----------------|
| Server state | employee list, insights | **TanStack Query** (cached, refetched after changes) |
| URL state | search, filters, sort, page | **URL query params** — shareable, survives refresh, back button works |
| Form state | add / edit employee | **React Hook Form** + Zod schema from `shared/` |
| Local UI state | dialog open/closed | `useState` |
| Global state | theme only | Styled Components `ThemeProvider` — no global store needed |

## 4. Data model

```mermaid
erDiagram
    EMPLOYEES }o--|| EXCHANGE_RATES : "paid in currency"
    EMPLOYEES ||--o{ SALARY_COMPONENTS : "broken down into (Phase 2)"
    EMPLOYEES {
        int id PK
        text employee_code UK "e.g. EMP-00042"
        text full_name
        text email UK
        text job_title
        text department
        text country "ISO code, e.g. IN"
        text currency "ISO code, e.g. INR"
        int annual_salary "whole units of local currency"
        text hire_date "YYYY-MM-DD"
        text created_at
        text updated_at
    }
    EXCHANGE_RATES {
        text currency PK "e.g. INR"
        real usd_rate "1 unit = X USD"
        text as_of_date
    }
    SALARY_COMPONENTS {
        int id PK
        int employee_id FK "deleted with the employee"
        text name "e.g. Basic, HRA"
        int annual_amount "whole units of local currency"
        int sort_order
    }
```

- **Salary components (Phase 2)** are optional. If an employee has any, they must add up exactly to `annual_salary`.
  Only earnings are stored; deductions such as PF and TDS are out of scope.

- Salary stored as an **integer** (no floating-point rounding issues for money).
- Indexes on `country`, `department`, `job_title`, `(country, job_title)` and `annual_salary` for fast filters and insights.

## 5. API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/employees?page=&pageSize=&search=&country=&department=&jobTitle=&sortBy=&sortOrder=` | Paginated, filtered list |
| GET | `/api/employees/:id` | One employee |
| POST | `/api/employees` | Create |
| PUT | `/api/employees/:id` | Update |
| DELETE | `/api/employees/:id` | Delete |
| GET | `/api/insights/summary` | Headcount, total payroll, average, median (USD) |
| GET | `/api/insights/by-country` | Stats per country (local + USD) |
| GET | `/api/insights/by-job-title?country=` | Stats per job title, optionally in one country |
| GET | `/api/insights/by-department` | Headcount & payroll per department |
| GET | `/api/insights/distribution` | Count of employees per salary band (USD) |
| GET | `/api/meta` | Lists of countries, departments, job titles (for dropdowns) |
| **Phase 2** | | |
| GET | `/api/employees/import/template?format=xlsx\|csv` | Download an empty template with the right columns |
| POST | `/api/employees/import?dryRun=true` | Upload a file → validate only, return preview (rows to add / update) and row-level errors |
| POST | `/api/employees/import` | Upload a file → validate and save everything in **one transaction** (all or nothing) |
| GET | `/api/employees/export?format=xlsx\|csv&...filters` | Download the current filtered list |
| GET | `/api/employees/:id/components` | Salary breakdown of one employee |
| PUT | `/api/employees/:id/components` | Replace the whole breakdown (validated: amounts > 0, unique names, sum = annual salary) |

Errors use one consistent shape: `{ "error": { "message": "...", "details": [...] } }` with proper status codes (400, 404, 409, 500).

## 6. Tech stack

| Area | Choice |
|------|--------|
| Language | TypeScript everywhere |
| Backend | Node.js + Express |
| Database | SQLite via `@libsql/client` (local file in dev, in-memory in tests, Turso in production) |
| Validation | Zod (one schema = runtime check + TypeScript type) |
| Excel / CSV (Phase 2) | ExcelJS (reads & writes .xlsx and .csv), Multer (file upload) |
| Frontend | React + Vite |
| Styling & UI | Styled Components + a small in-house component set built on central design tokens |
| Routing | React Router |
| Data fetching | TanStack Query (caching, loading & error states) |
| Forms | React Hook Form + Zod resolver |
| Charts | Recharts |
| Tests | Vitest, Supertest (API), React Testing Library (UI) |
| Deploy | Vercel (frontend + API) + Turso (hosted SQLite) |

Reasons for each choice are in [decisions & trade-offs](03-decisions.md).

## 7. Testing strategy

| Level | What | Tool | Speed |
|-------|------|------|-------|
| Unit | Services: validation, currency conversion, median/average, salary bands | Vitest | milliseconds, no DB |
| Integration | API endpoints against an **in-memory SQLite** DB with a small fixed dataset | Vitest + Supertest | fast, isolated per test |
| Component | Key UI pieces: employee form validation, table rendering, error states | React Testing Library | fast, API mocked |

All tests are **deterministic**: fixed test data, fixed seed for fake data, no network, no real clock.

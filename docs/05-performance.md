# Performance Considerations

10,000 employees is small for a database but **large for a browser table**.
The main rule: **send the browser only what it shows.**

| Concern | Approach |
|---------|----------|
| Showing 10,000 rows | **Server-side pagination** (e.g. 25 rows per page). The browser never holds the full list. |
| Search / filters / sorting | Done in **SQL** with `WHERE` / `ORDER BY` / `LIMIT` / `OFFSET`. |
| Search typing | **Debounced** (≈300 ms) so we don't fire a request on every keystroke. |
| Fast filters & grouping | **Indexes** on `(country, job_title)` (also covers country-only filters), `department`, `job_title`, `annual_salary`; unique on `email` and `employee_code`. |
| Insights | **Aggregated in SQL** (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP BY`). Only small summary tables go over the network. |
| Median | SQLite has no `MEDIAN`. Computed **in SQL with window functions** (`ROW_NUMBER` + `COUNT OVER` per group, then average of the middle one or two rows). Only one row per group leaves the database — individual salaries are never sent to the API. |
| Currency conversion | Join with the small `exchange_rates` table inside the query; no per-row work in JavaScript. |
| Repeated requests | **TanStack Query** caches responses in the browser; insights refetch only after data changes. |
| Seeding 10,000 rows | Inserted in **one transaction, in batches** (one round trip per batch, not per row). |
| Unbounded results | `pageSize` validated and capped (max 100); sort field **whitelisted** (never raw user input in SQL). |
| Unneeded columns | List query selects only the columns the table shows. |
| Form code size | Add/edit/delete dialogs (React Hook Form) are lazy-loaded; measured: main bundle 155 kB gzip, form dialog 15 kB gzip loaded on first open. |
| Chart library size | Recharts is only in the lazy-loaded Insights chunk — measured: 121 kB gzip, downloaded only when Insights is opened; main bundle stays 155 kB gzip. |
| Caching between deploys | Core libraries in a separate `vendor` file (144 kB gzip) that rarely changes; our own code is 12 kB gzip. Hashed asset files are served with `cache-control: immutable`. |
| Dropdown values | Countries come from `shared/` (no request). Departments / job titles from `/api/employees/filter-options` (`DISTINCT` on indexed columns). |
| Importing a large sheet | The browser reads the file; the API checks every row with a **handful of queries for the whole file** (countries, existing codes, emails — 500 values per `IN (…)`), then writes in **one transaction** with multi-row statements (~20 for 10,000 rows, codes reserved in one step). Capped at 10,000 rows and 5 MB per file; only the upload routes accept a 4 MB request body. The spreadsheet library is downloaded only when the upload dialog opens (161 kB gzip). |
| Exporting (Phase 2) | Uses the same filtered SQL query as the list, without pagination (export is the one place a full result set is intended). |

## Measured results

All numbers are measured, not estimated. Reproduce them with `npm run bench` (read-only; needs the seeded database).

### Query time inside the API (`npm run bench`)

The same service functions the API calls, without HTTP, on the local 10,000-employee SQLite file
(laptop, Node 24). 30 runs each after 5 warm-up runs.

| Operation | Median | Slowest |
|-----------|--------|---------|
| Employee list, page 1 (sorted by name) | 0.9 ms | 1.0 ms |
| Employee list, last page (offset 9,975) | 5.7 ms | 5.9 ms |
| Search "sharma" + country + salary sort | 1.0 ms | 1.6 ms |
| Employee list sorted by code | 0.9 ms | 1.0 ms |
| Filter options (countries, departments, titles) | 0.6 ms | 0.6 ms |
| Insights summary (incl. median) | 13.1 ms | 13.4 ms |
| Insights by country | 12.6 ms | 12.9 ms |
| Insights by job title, one country | 3.4 ms | 3.9 ms |
| Insights by department | 13.1 ms | 13.4 ms |
| Salary distribution (11 bands) | 1.8 ms | 2.0 ms |
| Export everyone (no paging) | 35.9 ms | 36.9 ms |

**What this shows:** list, search, sort and filters take about a millisecond. The insights that
compute a **median** for every group are the heaviest (~13 ms), because the median needs each
group's salaries sorted — still small next to the network time below. The last page costs more
than the first (5.7 vs 0.9 ms) because offset pagination skips 9,975 rows.

### Query plans (`EXPLAIN QUERY PLAN`, printed by `npm run bench`)

| Query | Plan | Meaning |
|-------|------|---------|
| Filter by country | `SEARCH … USING COVERING INDEX idx_employees_country_job_title (country=?)` | Index used |
| Filter by department | `SEARCH … USING COVERING INDEX idx_employees_department` | Index used |
| Filter by job title | `SEARCH … USING COVERING INDEX idx_employees_job_title` | Index used |
| Sort by salary, first page | `SCAN … USING COVERING INDEX idx_employees_annual_salary` (+ small sort for the id tie-breaker) | Reads rows in salary order |
| Sort by name, first page | `SCAN` + `USE TEMP B-TREE FOR ORDER BY` | No index on names: sorts all rows (0.9 ms at 10k) |
| Search by text | `SCAN` | `LIKE '%…%'` can't use an index (see bottlenecks) |

### Bulk operations

| Operation | Time | Notes |
|-----------|------|-------|
| Seed 10,000 employees | 0.06–0.08 s | Local SQLite file, laptop; 20 multi-row INSERTs in one transaction |
| Check a 10,000-row upload (9,999 updates + 1 error) | 0.06–0.11 s | Local API over HTTP; ~2.2 MB request. Saves nothing |
| Import 10,000 new employees | < 0.4 s | API test with an in-memory database (whole test file 0.43 s); one transaction |
| Export all 10,000 employees | 0.05–0.08 s | Local API over HTTP; 2.6 MB JSON (the file is then built in the browser). One country: 0.01 s |

### Live deployment (end to end, as a user feels it)

Measured with `curl` against the live app (Vercel function in Washington, D.C. `iad1` + Turso in
AWS us-east-1), **from India** — 6 requests per row, total time including the network:

| Request | Time | Notes |
|---------|------|-------|
| `/api/health` (no query) | 0.44–0.50 s | The baseline: network round trip India ↔ US + function overhead |
| Employee list, page 1 | 0.37–0.48 s | |
| Search + country filter + salary sort | 0.33–0.43 s | |
| Deep page (`page=400`) | 0.36–0.43 s | |
| Insights summary (incl. median) | 0.39–0.50 s | |
| Insights by country / department / job title | 0.39–0.57 s | |

**What this shows:** every request costs about the same as the health check, so the time is
mostly **distance**, not the queries. One request in 48 took **19.9 s**; it was not repeated and
these measurements don't show why (likely a cold start meeting a slow network moment) — it is
recorded rather than hidden. Deploying the function and database in a region near the users
(e.g. Mumbai) would cut most of the remaining time.

## Known bottlenecks (and what we'd change at larger scale)

| Bottleneck | Fine at 10k because… | At ~1M employees we would… |
|------------|---------------------|----------------------------|
| Search uses `LIKE '%term%'`, which can't use a normal index | A scan of 10k rows is small: search + filter + sort measured 1.0 ms | Use SQLite **FTS5** full-text search (or Postgres trigram index) |
| Offset pagination gets slower on deep pages | Max ~400 pages of 25: last page 5.7 ms vs 0.9 ms for the first | Switch to **cursor (keyset) pagination** |
| Median sorts each group's salaries (window function) on every request | Sorting 10k numbers is cheap: ~13 ms for all groups | Precompute stats on write / cache, or Postgres `percentile_cont` |
| Sorting by employee code can't use the code's index (it sorts by `length(code)`, then code, for number order) | Measured 0.9 ms for the first page on 10k rows (`npm run bench`) | Store the code's number in its own indexed column |
| Sorting by name has no index (`USE TEMP B-TREE FOR ORDER BY`) | Sorting 10k names for the first page: 0.9 ms | Add an index on `full_name` (cheap, but one more index to maintain on every write) |
| Insights recomputed on every request | Aggregations over 10k rows are cheap | Cache results and invalidate when employees change |

## What we intentionally did *not* add

- **Caching layer (Redis), read replicas, materialized views** — unnecessary at 10k rows; queries are already fast. Would revisit at ~1M rows or heavy traffic.
- **Cursor-based pagination** — offset pagination is simpler and fine at this size; cursor pagination would be the next step for very large tables.

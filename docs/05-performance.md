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
| Importing a large sheet (Phase 2) | Validate all rows in memory first, then write in **one transaction** using batched statements. File size capped (e.g. 5 MB ≈ well over 10k rows). |
| Exporting (Phase 2) | Uses the same filtered SQL query as the list, without pagination (export is the one place a full result set is intended). |

## Measured results

> To be filled in at build step 11 with real timings against the 10,000-employee database
> (no performance claims until they are measured).

| Operation | Time | Notes |
|-----------|------|-------|
| Employee list, page 1, no filters | — | |
| Employee list, search + filter + sort | — | |
| Insights summary (incl. median) | — | |
| Insights by country / job title | — | |
| Seed 10,000 employees | 0.06–0.08 s | Local SQLite file, laptop; 20 multi-row INSERTs in one transaction. |

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
| Search uses `LIKE '%term%'`, which can't use a normal index | A scan of 10k rows is small | Use SQLite **FTS5** full-text search (or Postgres trigram index) |
| Offset pagination gets slower on deep pages | Max ~400 pages of 25 | Switch to **cursor (keyset) pagination** |
| Median sorts each group's salaries (window function) on every request | Sorting 10k numbers is cheap | Precompute stats on write / cache, or Postgres `percentile_cont` |
| Sorting by employee code can't use the code's index (it sorts by `length(code)`, then code, for number order) | Measured 11–14 ms on 10k rows | Store the code's number in its own indexed column |
| Insights recomputed on every request | Aggregations over 10k rows are cheap | Cache results and invalidate when employees change |

## What we intentionally did *not* add

- **Caching layer (Redis), read replicas, materialized views** — unnecessary at 10k rows; queries are already fast. Would revisit at ~1M rows or heavy traffic.
- **Cursor-based pagination** — offset pagination is simpler and fine at this size; cursor pagination would be the next step for very large tables.

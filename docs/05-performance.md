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
| Median | SQLite has no `MEDIAN`. We fetch only the **sorted salary column** for the group and pick the middle value in the service — cheap for 10k numbers and easy to unit test. |
| Currency conversion | Join with the small `exchange_rates` table inside the query; no per-row work in JavaScript. |
| Repeated requests | **TanStack Query** caches responses in the browser; insights refetch only after data changes. |
| Seeding 10,000 rows | Inserted in **one transaction, in batches** (one round trip per batch, not per row). |
| Unbounded results | `pageSize` validated and capped (max 100); sort field **whitelisted** (never raw user input in SQL). |
| Unneeded columns | List query selects only the columns the table shows. |
| Chart library size | Dashboard route (with Recharts) is lazy-loaded, so the Employees page doesn't download it. |
| Dropdown values | Countries / departments / job titles loaded once from `/api/meta`. |
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
| Seed 10,000 employees | 0.06–0.08 s | Local SQLite file, laptop; 20 multi-row INSERTs in one transaction. Turso (network) to be measured at deploy. |

## Known bottlenecks (and what we'd change at larger scale)

| Bottleneck | Fine at 10k because… | At ~1M employees we would… |
|------------|---------------------|----------------------------|
| Search uses `LIKE '%term%'`, which can't use a normal index | A scan of 10k rows is small | Use SQLite **FTS5** full-text search (or Postgres trigram index) |
| Offset pagination gets slower on deep pages | Max ~400 pages of 25 | Switch to **cursor (keyset) pagination** |
| Median needs the sorted salary list per group | 10k integers is small | Precompute stats on write, or move to Postgres `percentile_cont` |
| Insights recomputed on every request | Aggregations over 10k rows are cheap | Cache results and invalidate when employees change |

## What we intentionally did *not* add

- **Caching layer (Redis), read replicas, materialized views** — unnecessary at 10k rows; queries are already fast. Would revisit at ~1M rows or heavy traffic.
- **Cursor-based pagination** — offset pagination is simpler and fine at this size; cursor pagination would be the next step for very large tables.

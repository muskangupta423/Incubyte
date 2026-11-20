# Performance Considerations

10,000 employees is small for a database but **large for a browser table**.
The main rule: **send the browser only what it shows.**

| Concern | Approach |
|---------|----------|
| Showing 10,000 rows | **Server-side pagination** (e.g. 25 rows per page). The browser never holds the full list. |
| Search / filters / sorting | Done in **SQL** with `WHERE` / `ORDER BY` / `LIMIT` / `OFFSET`. |
| Search typing | **Debounced** (≈300 ms) so we don't fire a request on every keystroke. |
| Fast filters & grouping | **Indexes** on `country`, `department`, `job_title`, `(country, job_title)`, `annual_salary`; unique on `email` and `employee_code`. |
| Insights | **Aggregated in SQL** (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `GROUP BY`). Only small summary tables go over the network. |
| Median | SQLite has no `MEDIAN`. We fetch only the **sorted salary column** for the group and pick the middle value in the service — cheap for 10k numbers and easy to unit test. |
| Currency conversion | Join with the small `exchange_rates` table inside the query; no per-row work in JavaScript. |
| Repeated requests | **TanStack Query** caches responses in the browser; insights refetch only after data changes. |
| Seeding 10,000 rows | Inserted in **one transaction / batches**, so seeding takes seconds instead of minutes. |
| Dropdown values | Countries / departments / job titles loaded once from `/api/meta`. |
| Importing a large sheet (Phase 2) | Validate all rows in memory first, then write in **one transaction** using batched statements. File size capped (e.g. 5 MB ≈ well over 10k rows). |
| Exporting (Phase 2) | Uses the same filtered SQL query as the list, without pagination; 10k rows produce a file in about a second. |

## What we intentionally did *not* add

- **Caching layer (Redis), read replicas, materialized views** — unnecessary at 10k rows; queries are already fast. Would revisit at ~1M rows or heavy traffic.
- **Cursor-based pagination** — offset pagination is simpler and fine at this size; cursor pagination would be the next step for very large tables.

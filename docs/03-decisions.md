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
| D7e | **Incubyte palette & fonts**: lime `#D3FE73` for active states (lighter `#E4FFA6` on hover), teal `#014D43` for headings and primary buttons (white text), secondary buttons white with teal text and border; Fraunces + Inclusive Sans. Dark mode swaps teal text for mint/lime so it stays readable on navy | Generic palette | Requested by the developer; colour roles named by purpose (`accent`, `heading`, `primary`, `secondaryText`) so a change is one edit in `tokens.ts` | Brand fonts load from Google Fonts |
| D7f | **All design tokens in `web/src/theme/tokens.ts`**; colours exposed as CSS variables | Theme object values used directly | One source of truth; light/dark switch only changes variable values (no React re-render, no wrong-theme flash, native controls follow via `color-scheme`) | Colours in the theme are `var(--color-x)` strings, not hex |
| D7g | **Light/dark preference**: saved choice → otherwise OS setting | Light only | Accessibility and comfort; respects the user's system setting | — |
| D7h | **Mobile-first responsive layout** (breakpoints 768px tablet, 1024px desktop) | Desktop-only | HR managers also check numbers on phones/tablets | — |
| D7i | **React Router**, Insights page **lazy-loaded** | Single page with tabs | Shareable URLs per page; charts library won't slow down the Employees page | — |
| D7j | **Components built only when a page needs them** (step 7: Button, PageHeader, LoadingState, ErrorState) | Build the full component set upfront | No unused code; each component is shaped by a real use | Component set grows step by step |
| D7k | **One `<table>` that becomes cards on phones** (CSS only, labels via `data-label`) | Separate table + card list components | One markup: no duplicated content for tests or screen readers; real table semantics on tablet/desktop | Phones show the sortable headers as a row of sort buttons |
| D7l | **Search text updates the URL on every keystroke (history `replace`), the request is debounced 300 ms** | Debounce the URL | The URL stays the single source of truth (no input/URL syncing code); one request per pause in typing | — |
| D7m | **Previous page stays visible (dimmed) while the next loads** (`keepPreviousData`) | Spinner on every change | No layout jump while paging or filtering | — |
| D7n | **Tests fake the API with MSW** (network level) | Mock `fetch` or the hooks | The real HTTP client, TanStack Query and components run in tests; unhandled requests are reported | One extra dev dependency |
| D7o | **One HTTP client** (`services/http-client.ts`) turning every failure into an `ApiError` with a user-safe message | `fetch` in each feature | Error handling in one place; offline/network errors get a clear message | API responses are trusted (typed by shared contracts, not re-validated) |
| D7p | **Native `<dialog>` + `showModal()`** for the form panel and confirmations | A dialog library; hand-built modal | The browser provides focus trapping, an inert background and Escape handling; we add labelling and focus return | jsdom lacks `showModal`, so tests use a small, documented stand-in |
| D7q | **React Hook Form + the shared `employeeInputSchema`** | Hand-written validation in the form | Browser and API enforce identical rules and messages; server-only errors (duplicate email) are mapped onto the matching field | — |
| D7r | **Currency shown live from the chosen country** (no currency input) | Currency dropdown | Mirrors the API rule (D13b); impossible to enter a mismatch | — |
| D7s | **Delete always asks for confirmation**, naming the person and code | Undo / soft delete | Deleting is permanent in this version; a clear confirmation is the simplest safe option | No undo (soft delete is a roadmap item) |
| D7t | **Which dialog is open = one discriminated-union state** | Several booleans (`isAddOpen`, `isEditOpen`, …) | Two dialogs can never be open at once; the edit/delete state always carries its employee | — |
| D7u | **Dialogs lazy-loaded** | Bundle everything | Form libraries (~15 kB gzip) download on first use; keeps the main bundle under Vite's 500 kB warning | Tiny delay on first open |
| D7v | **Every chart has a one-sentence takeaway** (e.g. "Engineering accounts for 52.5% of payroll and 42.7% of employees") | Charts only | HR gets the answer without reading axes; the sentences are pure functions with unit tests | — |
| D7w | **Single-series bar charts only** (horizontal for countries/departments, columns for salary bands) | Pie charts, multi-colour series | Bars compare values accurately; one brand colour needs no legend; horizontal bars fit long names on phones | — |
| D7x | **Charts coloured from theme tokens via CSS** | Hex colours passed to Recharts | Charts follow light/dark mode like the rest of the app | Styles target Recharts' class names |
| D7y | **Each dashboard section loads independently** (own request, loading and error state) | One combined request | A slow or failing chart doesn't block the others; "Try again" per section | 5 requests per filter change (each a few ms) |
| D7z | **Pay by job title in local currency when one country is selected**, USD otherwise | Always USD | HR thinks about a role's pay in the currency people are paid in; USD is needed only to compare countries | — |
| D7aa | **Any employee change refreshes all cached data** (`invalidateQueries()`) | Invalidate specific keys | Every screen (list, filter options, dashboard) is derived from employees; simplest correct rule | Refetches a little more than strictly needed |
| D7ab | **Chart values repeated in a visually hidden list** | Charts only | Screen-reader users get the same numbers as sighted users | — |
| D7a | **Recharts** for charts | MUI X Charts, Chart.js | Declarative React components, widely used, simple for bar/histogram charts | Extra dependency only used on the dashboard → lazy-loaded with the dashboard route |
| D7b | **React Hook Form + Zod** for forms | Controlled `useState` forms, Formik | Few re-renders, built-in Zod integration, same schema as the API | — |
| D7c | **Filters, search, sort and page stored in the URL** | Component state | Shareable links, refresh-safe, back button works; one source of truth | Slightly more code to read/write query params |
| D7d | **`shared/` workspace for Zod schemas & API types** | Duplicate types in api and web | Same rule ("salary > 0") in form and API without drift | Small coupling: both apps depend on `shared/` — limited to contracts, never implementation |
| D8 | **Server-side pagination & filtering** | Load all 10,000 rows in the browser | Keeps the page fast and memory-light; scales beyond 10k | Every filter change is a network request (debounced) |
| D9 | **Statistics computed in SQL / service, not in the browser** | Send raw data and compute in React | Less data over the network; logic is unit-testable in one place | — |
| D10 | **Store salary in local currency + fixed USD rate table** | Store everything in USD; live FX API | Matches how people are actually paid; fixed rates make numbers stable and tests deterministic | Rates go stale — date shown in UI, refreshing rates is a roadmap item |
| D11 | **Median as well as average**, computed in SQL | Average only; median in JavaScript | Salaries are skewed — on the seed data the median is $63.8k vs. a $71.4k average. Computing it in SQL (window functions) avoids sending 10k salaries to the API | Slightly more complex SQL, documented in the repository and covered by hand-checkable tests |
| D12 | **No authentication** (for now) | Simple login, OAuth | Single persona; time is better spent on salary features and insights | Not production-safe — first roadmap item |
| D13 | **Deterministic seed** (fixed random seed, realistic salary ranges per country & role) | Purely random values | Insights look realistic; the same data every run makes demos and debugging repeatable | — |
| D13a | **Own small name lists + seeded random generator** (mulberry32) for seed data | Faker library | No extra dependency; full control over realistic per-country names, salary ranges and headcount mix; deterministic by design | Names are less varied (12 × 12 per country), so emails get a number suffix on repeats |
| D13b | **Currency is derived from the country**, not entered | Separate currency field | Requirements say one currency per country; deriving it makes a mismatch (India employee paid in USD) impossible | Paying someone in a foreign currency would need a model change |
| D13c | **Supported countries are a constant in `shared/`** (code, name, currency); exchange rates stay in the DB | `countries` table | Used by API validation, seed and (soon) UI dropdowns from one source, with compile-time types; countries change rarely | Adding a country is a code change + a rate row |
| D13d | **Uniqueness enforced by the database** (UNIQUE constraint → 409), not by a SELECT first | Check-then-insert | Check-then-insert has a race: two requests at once could both pass the check | Error must be translated from the DB message (one small, tested function) |
| D13e | **PUT replaces the whole employee** (no PATCH) | PATCH partial updates | The edit form always sends every field; one schema for create and update | Clients must send all fields |
| D13f | **Future hire dates allowed** | Reject dates after today | HR adds people who accepted an offer but haven't started yet | — |
| D11a | **Same optional filters (country, department) on every insights endpoint**, sharing the list's SQL filter builder | Different filters per chart | Dashboard numbers can never disagree with each other or with the employee list | — |
| D11b | **Local-currency stats only when the group has one currency** | Always convert to one currency | Averaging INR and USD salaries in INR is meaningless; USD is always provided for cross-country comparison | Response field `local` can be null |
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

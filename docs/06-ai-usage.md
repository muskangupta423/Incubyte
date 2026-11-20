# AI Usage

The brief asks us to **use AI intentionally while keeping correctness and quality**.
This file records *how* AI was used and the prompts given.

## Tools

- **Claude Code** (Anthropic) — agentic coding assistant in the terminal.
- **[`CLAUDE.md`](../CLAUDE.md)** — my engineering standards for the agent. Claude Code loads it automatically
  in every session, so the rules apply to every step, not just the first prompt.

## How I worked with AI

| Phase | AI's role | My role |
|-------|-----------|---------|
| Understanding the brief | Explained the assignment in plain language, suggested a stack based on my background | Asked questions, chose the stack |
| Requirements & design | Drafted requirements, architecture, decisions, plan | Reviewed, decided scope (e.g. skip login), approved |
| Coding | Writes code and tests in small steps | Reviews every step before it is committed; asks for changes |
| Verification | Runs tests and the app | Manually checks behaviour in the browser |

**Guardrails I followed**

- Docs (requirements, design) were written **before** code, so AI built against an agreed plan.
- Coding standards were written down once in `CLAUDE.md` instead of being repeated in every prompt.
- Each step ends with a self-review against the checklist in `CLAUDE.md` (section 12) before I review it.
- Every change is reviewed by me before it is committed.
- Tests are required for core logic; AI-written code is not accepted without passing tests.
- AI suggestions that added unnecessary complexity were rejected (see [decisions](03-decisions.md)).

## Prompt log

Prompts in the order they were given. (Kept close to the original wording.)

### 1. Understanding the assessment

> Explain me this in layman language first. Also, suggest which language should I use.
> You can check my resume here (portfolio link). Ask question if any.
>
> *(followed by the full assessment brief)*

### 2. Answering clarifying questions

> 1. No deadline mentioned — faster submission is prioritised.
> 2. I have used React, Flutter, TypeScript, SCSS, styled-components (not MUI/Mantine/etc.).
> 3. I have a Vercel account.
> 4. Skip the login page to submit faster.
> 5. You write the code while I review each step.
>
> First let's create the artifacts mentioned in the assessment. It should be simple to understand.

### 3. Reviewing the requirements

> We should not skip Excel / CSV import & export. We can add it in phase 2.

*Outcome:* AI had placed import/export under "out of scope". I moved it into scope as **Phase 2**
because HR's data lives in Excel today — without import the product can't replace it.

### 4. Salary components

> Should there be salary compensation components too? Like Basic, HRA, Special allowance, food coupon, PF, mediclaim deduction, LWF, TDS etc.

*AI's view:* deductions (PF, TDS, LWF…) are country-specific payroll/tax rules — a different product — and the org is multi-country.

> Yes, add light version for Phase 2.

*Outcome:* Phase 2 adds an optional breakdown of **earning components only**, with free-text names (works for any country)
that must add up to the annual salary. Deductions stay out of scope (see decisions D19–D22).

### 5. Engineering standards (before coding)

> *(Full text in [`CLAUDE.md`](../CLAUDE.md) — three parts: Engineering Standards,
> Avoid AI-generated code complexity, Developer Experience & Learning.)*
>
> Also, check if we need to update docs/06-ai-usage.md file.

*Outcome:* the standards were saved as `CLAUDE.md` so the agent follows them in every session. They changed earlier AI choices:

| Before (AI's first proposal) | After (my standards) |
|------------------------------|----------------------|
| MUI component library | **Styled Components** + small in-house components on central design tokens |
| MUI X Charts | **Recharts** (lazy-loaded with the dashboard) |
| Plain controlled forms | **React Hook Form** + shared Zod schema |
| Filters in component state | Filters, search, sort, page in the **URL** |
| Performance claims like "about a second" | Removed — a **measurement step** was added to the plan; numbers go in the performance doc |
| Frontend `pages/` + `components/` | **Feature folders** (`employees`, `dashboard`, `compensation`, `csv`) |

### 6. Backend steps (1–6)

Short prompts per step ("start", "commit") — the plan and `CLAUDE.md` carried the detail.
My review questions changed the code along the way, for example:

> Is job_title repeated in "Indexes on (country, job_title), department, job_title"?

*Outcome:* AI verified with `EXPLAIN QUERY PLAN` that the separate `job_title` index is needed
(a two-column index only helps when the search starts with its first column) and documented why.

> We have not created UI yet, right? … OK, do BE first.

*Outcome:* I chose backend-first over vertical slices, so the UI is built on a finished, tested API.

### 7. UI theme

> We can go with the company's theme. Check https://incubyte.co/ and use the theme used there.
> If possible, give a toggle to switch between light and dark mode. Go with a clean, professional
> HR-tool look: a light background, one accent colour and a clear table layout. Theme colours,
> spacing, font sizes etc. should be defined once at a common place. Design it with responsiveness —
> mobile, tablet and desktop.

*Outcome:* AI read the site's design variables (`--e-global-color-primary: #014D43`, lime `#D3FE73`,
mint `#EBFFF6`, navy `#060A1E`; fonts Fraunces + Inclusive Sans) and built `web/src/theme/tokens.ts`
as the single source of design tokens, with a light/dark toggle. Only the palette and fonts are used —
the app is ACME's product, so no Incubyte logo or name.

> Active colour can be #d3fe73, hover a little lighter. Use #014d43 for main headings and the primary
> CTA background with white text. Secondary CTA: #014d43 text on a white background.

*Outcome:* colour tokens were renamed by purpose (`accent`, `heading`, `primary`, `secondaryText`) and
updated in one file. AI flagged that teal text is unreadable on the dark navy background, so dark mode
uses mint headings, lime secondary text and a slightly brighter teal for primary buttons.

### 8. Frontend steps

Step 8 (Employees table) — "start". Self-review caught issues before I saw them, e.g. routing tests
that silently hit unmocked API endpoints, non-null assertions and a dynamic `delete` flagged by lint;
all fixed before review rather than suppressed.

Step 9 (add / edit / delete) — "yes". Self-review: removed an `!important` and a type assertion,
replaced several booleans with one discriminated union, and lazy-loaded the dialogs after the build
warned about bundle size.

Step 10 (Insights dashboard) — "yes". Self-review: replaced Recharts' default tooltip (which needed
`!important` overrides) with a themed one, extracted the URL-filter parsing shared by both pages, and
fixed two tests that matched the wrong element (the "Employees" nav link) instead of weakening them.

### 9. My catch: employee codes should be assigned by the system

While testing the app myself, I added a few employees and kept getting
"Another employee already has this employee code." With 10,000 employees, an HR manager can't know
which codes are free. I raised it:

> Like there are 10k employees. When I tried to add a new employee, I added 2–3 employee ids and got
> the error 'Another employee already has this employee code.' Now as a new-hire HR, how do I remember
> whether that id exists or not? How should I know the next id? There should be some serial maybe.

**This was a gap in the AI's design that I found through hands-on product testing**, not something
the AI flagged. The AI had made the code a required, user-entered field. My question turned it into a
better design:

- Codes are now **assigned by the system** (next number in the EMP-xxxxx series) and shown read-only.
- The AI's first idea, "highest code + 1", would **reuse** a code after the newest employee is deleted.
  It was changed to a counter that only goes up, advanced in the same transaction as the insert, so
  failed saves don't use up numbers and two HR users saving at once can't clash.
- Decisions D13g and D13h record the reasoning; six API tests cover it.

Lesson: AI produced a technically valid form, but only using the product as the HR persona revealed that
the workflow was unworkable. Reviewing AI output as a user, not just as a code reviewer, matters.

### 10. My usability review after testing the app

I used the app as the HR manager and raised issues the AI had not considered (the first four below; 5–12 came later, after deploying):

> 1. Pagination should be sticky to the bottom — with many rows I have to scroll to the bottom a lot to change page.
> 2. There should be a "jump to page" option — for lakhs of employees, previous/next isn't enough.
> 3. Move error/success toasts to the top.
> 4. There should be bulk upload and bulk delete — upload sheet data in a required format, and checkboxes
>    to select multiple employees and delete them at once.

| # | My feedback | Outcome |
|---|-------------|---------|
| 1 | Sticky pagination | Pagination is now a compact bar stuck to the bottom of the screen |
| 2 | Jump to page | "Go to page" box. The AI first clamped out-of-range numbers (1111111 → last page); I questioned that while testing, and it now shows *"Enter a page from 1 to 400"* and stays on the current page, so typos are noticed instead of hidden. Its test also exposed that the browser's built-in validation blocked the submit before our code ran — fixed with `noValidate`, consistent with the other forms |
| 3 | Toasts on top | Toasts moved to the top (top-right on desktop, top-center on phones), clear of the sticky pagination |
| 3b | Hover state for Edit / Delete (raised during review) | Their hover used the same grey as the row hover, so it was invisible on desktop. Edit now hovers lime (the accent), Delete hovers soft red with a red icon (clearly destructive), and both show a tooltip naming the employee |
| 4a | Bulk delete | Done: a checkbox on each row (top-right on phone cards) and "select all on this page" (shows a dash when only some are ticked); a bar with "N selected · Clear selection · Delete selected" stays at the bottom with the pagination; one confirmation names the first five ("and 19 more"), then one request deletes them all together. **My catch while testing:** the AI's first version kept ticks only on the current page, so going to the next page lost the earlier selection. I reported it as a bug. The fix still cleared ticks on every new search, so I reported that too: searching is the quickest way to collect specific people. Now ticks stay while paging, sorting, searching and filtering (until cleared or deleted), the bar says "30 selected · 5 on this page", and up to 500 can be deleted at once |
| 4b | Bulk upload | Done: an **Upload** button next to Add employee. Download the template (.xlsx, with a Countries sheet), choose an .xlsx or .csv, and the file is checked before anything is saved: *"148 rows ready: 120 new, 28 updates"*, or every problem as *Row 42 · Annual salary: …*. Import saves all rows or none. Empty Employee code = new employee (code assigned), a code = update that employee. Up to 10,000 rows |
| 5 | Salary distribution labels overlapping (raised after deploying) | The chart was the only one with vertical bars: 11 range labels ("$100K–$125K") side by side did not fit a half-width card. I suggested a full-screen button per chart; the AI recommended fixing the cause instead — full screen would leave the normal view unreadable. Agreed: the chart now uses horizontal bars like the others (one row per range, label on the left), and the unused vertical layout was removed from the shared chart. Full screen kept as a later option if a chart outgrows its card |
| 6 | "Median salary" not understandable | The AI had used the statistics term with no explanation. If I had to ask what it meant, an HR manager would too. The screen now leads with plain words and keeps the precise term: **"Typical salary (median)"**, **"Typical pay by country (median, USD)"**, table column **"Typical (median)"**, and takeaways say *"Typical pay is highest in…"*. The card under it still explains *"Half earn more, half earn less"* |
| 7 | Read-only "Employee code" looked editable | It had the same white box as the other fields, so clicking it felt broken. Read-only fields now look different: grey background, lighter border, no hover change, normal cursor. The style lives in the shared form-control styles, so any future read-only field gets it too |
| 8 | Sliding animation when a modal opens, and (after trying it) when it closes | Side panels (add / edit) slide in from the right and out again; confirmation boxes rise and fade in, then sink and fade out; the dimmed background fades both ways. Closing waits for the animation before the dialog is removed. Timing comes from new shared `motion` tokens, and people who turn on "reduce motion" in their system settings get no animation |
| 9 | "Why do Job title and Department look different from the other dropdowns?" | They are different fields on purpose: Country is a fixed list, while Job title / Department are text boxes with suggestions, so HR can add a new role. The browser draws the two kinds differently (the suggestions arrow only appears on hover). The AI offered three options; I chose to keep typing allowed and make them look the same: every dropdown-like field (form, filters, "Rows per page") now shows one shared arrow drawn by the app, and the browser's own arrows are hidden |
| 10 | Responsive layout on iPad mini and phones: widths not aligned, "Clear filters" looked like a dropdown, pagination hidden on small phones, search and dropdowns taking too much space; I suggested a search icon that expands and a + icon for "Add employee" | Cause on iPad mini: the 8-column table made the whole page wider than the screen, so everything else looked too narrow. The AI proposed designs and I chose: on tablets the table scrolls sideways inside its own card with Edit/Delete pinned on the right; on phones search stays visible (the AI argued against hiding it behind an icon, because searching is the main way to find someone) and the dropdowns move into a "Filters" panel; active filters show as removable chips with "Clear all" on phones and tablets; phone pagination is one slim row, ‹ Page [3] of 400 ›, where the number is the go-to-page box; and a + button next to the title. After reviewing, I asked for the iPad pagination to fit one row: tablets now show shorter labels ("1–25 of 10,000", "Rows", "Go to"), while screen readers still hear the full words. Desktop is unchanged. Checked with screenshots at 768, 375 and 320 px |
| 11 | Notifications should be green when an employee is added and red when one is deleted | Every toast looked the same (dark, lime edge). Toasts now have a tone: green with a ✓ for adding and saving, red with a bin icon for single and bulk deletes, and the original neutral style for other notices (e.g. the 500-selection limit). Soft tinted background with a strong coloured edge, so the text stays easy to read in light and dark mode |
| 12 | "The assessment says multiple countries, but we fixed 8 countries. There should be an option to add more countries on Add employee, and the filter should list only countries that are added" | The AI had hard-coded 8 countries. Now countries live in the database: the Country dropdown ends with "+ Add another country", where HR picks from a world list (currency filled in) and enters an exchange rate only for a new currency; the new country is selected straight away. Filters list countries that have employees. Existing databases (including the live one) get their countries automatically on start-up |

These came from **using the product, not reading the code** — the same way I caught the employee-code
problem (section 9). The AI built what was specified; real HR workflows (hundreds of pages, many rows
to clean up) needed these additions.

> *(more to be added as we build)*

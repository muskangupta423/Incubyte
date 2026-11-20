# AI Usage

The brief asks us to **use AI intentionally while keeping correctness and quality**.
This file records how AI was used, the prompts given, and what my own reviews changed.

## Tools

- **Claude Code** (Anthropic), an agentic coding assistant in the terminal.
- **[`CLAUDE.md`](../CLAUDE.md)**: my engineering standards for the agent. Claude Code loads it in every
  session, so the rules apply to every step, not just the first prompt.

## How I worked with AI

| Phase | AI's role | My role |
|-------|-----------|---------|
| Understanding the brief | Explained it in plain language, suggested a stack for my background | Asked questions, chose the stack |
| Requirements & design | Drafted requirements, architecture, decisions, plan | Reviewed, decided scope (e.g. skip login), approved |
| Coding | Wrote code and tests in small steps, with a self-review before each | Reviewed every step before it was committed; asked for changes |
| Verification | Ran tests, lint, type checks and the app | Tested the app myself as the HR manager |

**Guardrails:** docs before code; standards written once in `CLAUDE.md`; every step ends with tests, lint
and type checks passing, then my review, then a commit; AI suggestions that added complexity were rejected
(see [decisions](03-decisions.md)).

## Highlights: what my own testing caught

AI built what was specified. Using the product **as the HR manager** found what the specification missed:

- **Employee codes typed by hand** (section 6), unworkable with 10,000 employees. Now assigned by the system and never reused.
- **Bulk delete lost the selection** when changing page, and again on a new search (section 7, #4a).
- **"Go to page 1111111" silently jumped to the last page**: now an error, so typos are noticed (#2).
- **Only 8 hard-coded countries**, though the brief says multiple countries (#12). Countries are now data HR can add.
- **Unclear wording and layout**: "median", overlapping chart labels, a read-only field that looked editable,
  a broken iPad layout (#5–#10).

## Prompt log

Prompts in the order given, kept close to the original wording.

### 1. Understanding the assessment

> Explain me this in layman language first. Also, suggest which language should I use.
> You can check my resume here (portfolio link). Ask question if any.
>
> *(followed by the full assessment brief)*

> 1. No deadline mentioned — faster submission is prioritised.
> 2. I have used React, Flutter, TypeScript, SCSS, styled-components (not MUI/Mantine/etc.).
> 3. I have a Vercel account.
> 4. Skip the login page to submit faster.
> 5. You write the code while I review each step.
>
> First let's create the artifacts mentioned in the assessment. It should be simple to understand.

### 2. Scope

> We should not skip Excel / CSV import & export. We can add it in phase 2.

*Outcome:* AI had put import/export out of scope. I moved it into **Phase 2**: HR's data lives in Excel,
so without import the product can't replace it.

> Should there be salary compensation components too? Like Basic, HRA, Special allowance, food coupon, PF,
> mediclaim deduction, LWF, TDS etc.

> Yes, add light version for Phase 2.

*Outcome:* AI explained that deductions (PF, TDS…) are country-specific payroll rules, a different product.
Phase 2 planned an optional breakdown of **earning components only**. Later I **deferred** it, to finish
and polish the rest first.

### 3. Engineering standards (before coding)

> *(Full text in [`CLAUDE.md`](../CLAUDE.md): Engineering Standards, Avoid AI-generated code complexity,
> Developer Experience & Learning.)*

*Outcome:* the standards changed AI's first proposals:

| Before (AI's first proposal) | After (my standards) |
|------------------------------|----------------------|
| MUI components and charts | **Styled Components** on central design tokens; **Recharts**, lazy-loaded |
| Plain controlled forms | **React Hook Form** + the shared Zod schema |
| Filters in component state | Filters, search, sort and page in the **URL** |
| Performance claims like "about a second" | Removed; numbers are **measured** (`npm run bench`) |
| `pages/` + `components/` folders | **Feature folders** |

### 4. Building the API, then the UI

Short prompts per step ("start", "commit"); the plan and `CLAUDE.md` carried the detail. Review questions
still changed things:

> Is job_title repeated in "Indexes on (country, job_title), department, job_title"?

*Outcome:* AI showed with `EXPLAIN QUERY PLAN` that the separate `job_title` index is needed
(a two-column index only helps when the search starts with its first column), and documented it.

> We have not created UI yet, right? … OK, do BE first.

*Outcome:* the UI was built on a finished, tested API. AI's self-reviews before each of my reviews caught
smaller issues (tests hitting unmocked endpoints, `!important` overrides, a bundle-size warning).

### 5. UI theme

> We can go with the company's theme. Check https://incubyte.co/ and use the theme used there.
> If possible, give a toggle to switch between light and dark mode. Go with a clean, professional
> HR-tool look: a light background, one accent colour and a clear table layout. Theme colours,
> spacing, font sizes etc. should be defined once at a common place. Design it with responsiveness —
> mobile, tablet and desktop.

> Active colour can be #d3fe73, hover a little lighter. Use #014d43 for main headings and the primary
> CTA background with white text. Secondary CTA: #014d43 text on a white background.

*Outcome:* one token file (`web/src/theme/tokens.ts`) with Incubyte's palette and fonts, colours named by
purpose, and a light/dark toggle. AI flagged that teal text is unreadable on navy, so dark mode uses mint
and lime instead. No Incubyte logo or name: the app is ACME's product.

### 6. My catch: employee codes should be assigned by the system

> Like there are 10k employees. When I tried to add a new employee, I added 2–3 employee ids and got
> the error 'Another employee already has this employee code.' Now as a new-hire HR, how do I remember
> whether that id exists or not? How should I know the next id? There should be some serial maybe.

> As per your logic … what if the user deletes the latest last added employee with highest id?

**A gap in the AI's design, found by using the product, not flagged by the AI.** Codes are now assigned
by the system and shown read-only. AI's first fix ("highest code + 1") would **reuse** a code after the
newest employee is deleted, so it became a counter that only goes up, advanced in the same transaction
as the insert (decisions D13g–h; six API tests).

### 7. My usability review after testing the app

> 1. Pagination should be sticky to the bottom — with many rows I have to scroll to the bottom a lot to change page.
> 2. There should be a "jump to page" option — for lakhs of employees, previous/next isn't enough.
> 3. Move error/success toasts to the top.
> 4. There should be bulk upload and bulk delete — upload sheet data in a required format, and checkboxes
>    to select multiple employees and delete them at once.

Items 5–12 came after deploying.

| # | My feedback | Outcome |
|---|-------------|---------|
| 1 | Sticky pagination | A compact bar stuck to the bottom of the screen |
| 2 | Jump to page; then: *"on adding 1111111 in goto … It took me to last page. Is it correct?"* | AI had clamped it to the last page. Now: *"Enter a page from 1 to 400"*, staying on the current page |
| 3 | Toasts on top; *"There should be some hover state for edit and delete button too"* | Toasts at the top; Edit hovers lime, Delete hovers red, both with tooltips |
| 4a | Bulk delete; then: *"If i go to next page and select more then previous selection is getting lost"*; then: *"if i search something then selected items are lost"* | Checkboxes and select-all, one confirmation naming people, one request. **Both were bugs I reported**: ticks now stay while paging and searching, and the bar shows *"30 selected · 5 on this page"* |
| 4b | Bulk upload | Excel/CSV with a template; the file is checked first (*Row 42 · Annual salary: …*), then saved all or nothing |
| 5 | *"In Salary distribution (USD) chart salary text is overlapping … We can … open it on full screen"* | AI recommended fixing the cause; the chart now uses horizontal bars like the others |
| 6 | *"Median salary term is not understandable to me"* | Plain words first: **"Typical salary (median)"** |
| 7 | *"Employee code part on modal should be some grayish … looks like editable but on clicking its not"* | Read-only fields are greyed in the shared form styles |
| 8 | *"there should be some sliding animation on opening modal"*, then *"closing modal should also have animation"* | Dialogs slide/fade in and out; none with "reduce motion" |
| 9 | *"why Job title dropdown and other dropdowns different?"* | Different on purpose (typing a new title is allowed); I chose one shared arrow so they look the same |
| 10 | *"For ipad mini design alignment is not correct … Clear Filters CTA … looking like a dropdown … on mobile, the pagination is getting hidden … May be we can give just a search icon … Just a + icon instead of Add Employee"* | Cause: the table made the page wider than the screen. I chose from AI's designs: table scrolls in its card on tablets; on phones search stays visible (AI argued against hiding it), filters in a panel, filter chips, a one-row pager, a **+** button. Then *"On ipad mini pagination is of 2 lines"*: shorter tablet labels |
| 11 | *"For adding new employee, notification should be in some green shade. For deleting employee, … red shade"* | Green ✓ for added/saved, red for deleted |
| 12 | *"in assessment it was written multiple countries. We have added fixed countries … There should be option to add more countries on add employee. In filter, there should be only countries which are added"* | Countries are data: "+ Add another country" picks from a world list (rate needed only for a new currency); filters list countries that have employees |

### 8. Deploying

> let's first deploy on versel

Two deploy failures came from AI mistakes, both found from the build logs and the live site:

- A top-level `api/` folder made Vercel compile every backend file as its own function. The folder was renamed to `server/` (D24).
- The API worked locally but crashed on Vercel, because the bundle relied on `node_modules`, which isn't deployed.
  Fixed, and the build now **loads the function in an empty folder**, so this kind of bug fails the build, not the live site.

## What I learned

AI was fast at producing working, tested code that followed my standards. It was **not** good at
noticing when a working feature was awkward for the real user: typed employee codes, lost selections,
statistics jargon. Testing as the HR persona, and questioning the AI's first answer ("is that correct?",
"what if…?"), mattered as much as code review.

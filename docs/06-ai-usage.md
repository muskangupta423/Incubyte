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

> *(more to be added as we build)*

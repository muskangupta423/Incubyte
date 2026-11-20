# AI Usage

The brief asks us to **use AI intentionally while keeping correctness and quality**.
This file records *how* AI was used and the prompts given.

## Tools

- **Claude Code** (Anthropic) — agentic coding assistant in the terminal.

## How I worked with AI

| Phase | AI's role | My role |
|-------|-----------|---------|
| Understanding the brief | Explained the assignment in plain language, suggested a stack based on my background | Asked questions, chose the stack |
| Requirements & design | Drafted requirements, architecture, decisions, plan | Reviewed, decided scope (e.g. skip login), approved |
| Coding | Writes code and tests in small steps | Reviews every step before it is committed; asks for changes |
| Verification | Runs tests and the app | Manually checks behaviour in the browser |

**Guardrails I followed**

- Docs (requirements, design) were written **before** code, so AI built against an agreed plan.
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

### 5. Coding

> *(to be added)*

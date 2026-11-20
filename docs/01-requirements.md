# Requirements — ACME Salary Management

> One-page requirements, written **before** any code.

## 1. Goal

ACME's HR team manages salaries for **10,000 employees across several countries** in Excel sheets.
This is slow, error-prone, and makes it hard to answer simple questions like
*"What do we pay engineers in India?"*.

We will build a **web app** that lets the **HR Manager**:

1. **Manage** salary data in one place (instead of spreadsheets).
2. **Understand** how the organization pays people, through clear insights.

**Success looks like:** the HR Manager can find any employee in seconds, update a salary safely,
and answer common pay questions without building a pivot table.

## 2. User

**HR Manager** (single persona). Comfortable with Excel, not technical. Cares about speed, accuracy and clear numbers.

## 3. In scope (what we will build)

| # | Feature | Why it matters to the HR Manager |
|---|---------|----------------------------------|
| F1 | **Employee list** with search (name / email / employee code), filters (country, department, job title) and sorting (name, salary, hire date) | Replaces scrolling through Excel; must stay fast with 10,000 rows |
| F2 | **Add / edit / delete employee**, with validation (required fields, valid email, salary > 0, supported country; currency is set automatically from the country; employee code and email must be unique) | Keeps data clean; no more typos in cells |
| F3 | **Salaries stored in local currency**, also shown in **USD** using a fixed exchange-rate table | Employees are paid in many currencies; comparison needs one common unit |
| F4 | **Insights dashboard**: headcount, total payroll, average & median salary (in USD) | Quick picture of the whole org |
| F5 | **Pay by country**: headcount, min / median / average / max per country | "How do we pay people in each country?" |
| F6 | **Pay by job title within a country** (e.g. Software Engineer in India) | The most common real question — fair pay for a role in a location |
| F7 | **Pay by department** and a **salary distribution** chart (salary bands) | Spot where payroll goes and outliers |
| F8 | **Seed script** creating 10,000 realistic, repeatable employees | Required; also lets reviewers try the app with real-sized data |

### Phase 2 — Moving off Excel

Built after Phase 1 (F1–F8) is working and deployed, so a usable product exists first.

| # | Feature | Why it matters to the HR Manager |
|---|---------|----------------------------------|
| F9 | **Import employees from Excel (.xlsx) or CSV**, with a downloadable template. Rows are matched by `employee_code`: new codes are added, existing ones are updated. | HR's data lives in Excel today. Without import, switching means retyping 10,000 rows. |
| F10 | **Import preview & validation**: every row is checked first, errors are listed by row number and reason (e.g. *"Row 42: salary must be greater than 0"*). Nothing is saved unless the whole file is valid. | Avoids half-imported, broken data. HR can fix the sheet and retry. |
| F11 | **Export to Excel / CSV** for the current filtered list | HR can still share data or do ad-hoc analysis in Excel when needed. |
| F12 | **Salary breakdown (light)**: optional list of **earning components** per employee (e.g. Basic, HRA, Special Allowance), each with an annual amount. Components must **add up exactly to the annual salary**. Names are free text, so any country can use its own components. | HR can see and record how CTC is structured, without a payroll engine. |

## 4. Deliberately out of scope (and why)

| Left out | Reason |
|----------|--------|
| **Login & roles** | One persona (HR Manager). Auth adds time without showing new product thinking. In production this is a must — first item on the roadmap. |
| **Salary history / audit trail** | Valuable, but doubles the data model. Current version keeps only the current salary. |
| **Live currency exchange rates** | Needs an external API and changes numbers daily. A fixed, dated rate table keeps insights stable and testable. |
| **Payroll processing, tax, bonuses, benefits** | Different problem (payroll, not salary management). |
| **Deductions & statutory rules** (PF, TDS, LWF, professional tax, mediclaim deduction, food-coupon tax rules) | These are country-specific payroll/tax calculations applied at pay time, and they affect take-home pay, not salary. Supporting them means a tax engine per country. Phase 2 records **earning components only** (F12). |
| **Approvals / workflows, notifications** | Needs multiple users — not needed for a single HR Manager. |
| **Multi-company support** | Only ACME uses this. |

## 5. Assumptions

- Salary = **annual gross salary (CTC)**, stored in the employee's **local currency**. All insights use this number; the optional breakdown (F12) is for record only.
- Each country has one currency (e.g. India → INR, USA → USD).
- Exchange rates are a **fixed snapshot** stored in the database, with the date shown in the UI.
- Data volume: ~10,000 employees; a single SQLite database is more than enough.

## 6. Non-functional requirements

- **Fast**: list and insights respond in well under 1 second with 10,000 employees (server-side pagination and SQL aggregation — see [performance](05-performance.md)).
- **Correct**: core logic (validation, currency conversion, statistics) covered by fast, deterministic unit tests.
- **Simple to run**: one command to install, seed and start locally.
- **Deployed**: publicly accessible on Vercel, plus a short video demo.

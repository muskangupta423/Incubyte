# CLAUDE.md — Instructions for AI coding agents

This file is loaded automatically by Claude Code in every session. It holds the engineering standards
the developer wrote for this project. Project context lives in [`docs/`](docs/) — read
[requirements](docs/01-requirements.md), [architecture](docs/02-architecture.md) and [plan](docs/04-plan.md) before coding.

Working agreement: the AI writes code in small steps; the developer reviews every step before it is committed.
Each step ends with passing tests, type check, lint, and an incremental commit.

---

# Engineering Standards — Mandatory Throughout Development

These standards apply to the entire application. Do not treat them as optional cleanup tasks to be performed at the end.

The codebase should reflect the engineering quality expected from a frontend engineer with approximately 6 years of experience building production applications.

The goal is not to maximize the number of abstractions, files, design patterns, or technologies. The goal is to create code that is clean, understandable, scalable, reusable where appropriate, testable, performant, and easy to extend.

## 1. Code Structure and Separation of Concerns

Organize code by feature and responsibility rather than placing everything in large generic folders.

Avoid:

- Giant components
- Giant service files
- Business logic inside UI components
- API calls scattered across components
- Duplicate logic across features
- Deeply nested folder structures without a clear purpose
- Circular dependencies
- Files with unrelated responsibilities

Maintain clear boundaries between:

- UI/presentation
- Feature-specific logic
- API communication
- Business logic
- Data access
- Validation
- Shared utilities
- Types and contracts

Prefer feature-oriented organization where it improves discoverability and maintainability.

A developer should be able to locate employee-related code without searching through unrelated dashboard, analytics, or CSV modules.

Before introducing a new folder, abstraction, or architectural pattern, consider whether it actually improves the codebase.

---

## 2. Frontend Architecture

Keep the frontend modular and organized.

Use a reasonable structure similar to:

- `app/` — application initialization, routing and global providers
- `components/` — genuinely reusable UI components
- `features/`
  - `employees/`
  - `dashboard/`
  - `compensation/`
  - `csv/`
- `hooks/` — shared hooks only
- `services/` — shared infrastructure services where appropriate
- `theme/` — theme, tokens and global styles
- `utils/` — pure shared utilities
- `types/` — shared application types, if needed

Adapt this structure as the project evolves. Do not create empty folders or force every feature to have the same structure if it does not need it.

Keep feature-specific components, hooks, types, and API functions close to the feature they belong to.

### Component responsibilities

Each React component should have a clear responsibility.

- Keep components focused.
- Avoid components that manage multiple unrelated workflows.
- Extract reusable logic into hooks when it genuinely improves readability.
- Extract UI components when they have meaningful reuse or independent responsibility.
- Keep rendering logic declarative.
- Avoid excessive conditional rendering and deeply nested ternaries.
- Avoid unnecessary prop drilling.
- Avoid passing large numbers of unrelated props.
- Avoid components that know too much about backend implementation details.

Do not create abstractions just to reduce the number of lines in a component.

A component should be reusable because its behavior and responsibility are reusable—not merely because it contains JSX.

---

## 3. Reusable Component and Design System Standards

Create reusable components for recurring UI patterns.

Examples may include:

- Button
- IconButton
- Input
- Select
- SearchInput
- PageHeader
- Card
- StatCard
- Badge
- Modal/Dialog
- Dropdown
- Tooltip
- Table
- Pagination
- FilterBar
- EmptyState
- LoadingState
- ErrorState
- Toast/Notification

Use Styled Components consistently.

Centralize:

- Color tokens
- Typography
- Spacing
- Border radius
- Shadows
- Breakpoints
- Z-index conventions

Avoid hardcoding the same styles, colors, spacing, or UI patterns in multiple places.

Components should support reasonable variants and sizes without becoming excessively configurable.

Do not build a component library for the sake of building a component library. Prioritize components that are reused across the application or benefit from consistent behavior.

Ensure accessible component behavior, including:

- Keyboard interaction
- Focus states
- Semantic HTML
- Accessible labels
- Appropriate ARIA attributes
- Color contrast

---

## 4. TypeScript Standards

Use TypeScript strictly and intentionally.

- Enable strict mode.
- Avoid `any`.
- Avoid unnecessary type assertions.
- Do not suppress compiler errors using `@ts-ignore`.
- Do not use non-null assertions without a clear reason.
- Define clear types for API requests and responses.
- Use discriminated unions for complex state where appropriate.
- Use type-safe component props.
- Keep types close to their domain when they are feature-specific.
- Share types only when multiple modules genuinely need them.

Do not create overly generic types that make code harder to understand.

Use Zod for runtime validation at external boundaries, such as API inputs, form data, and CSV records.

Remember that TypeScript types alone do not validate runtime data.

---

## 5. State Management Standards

Be intentional about state.

Distinguish between:

- Server state
- Local component state
- URL state
- Form state
- Global application state

Use TanStack Query for server state.

Use React state for local UI state.

Use URL query parameters for shareable or navigable states such as employee filters, search, sort, and pagination where appropriate.

Use React Hook Form for complex forms.

Avoid:

- Duplicating server data in local state
- Unnecessary global state
- Multiple sources of truth
- Storing derived values that can be calculated
- Excessive Context providers
- Complicated synchronization logic

Prefer deriving values over storing them independently.

---

## 6. API and Backend Code Standards

Keep the backend modular and maintainable.

Use clear layers for:

- Routing
- Request validation
- Business logic/services
- Data access
- Response handling
- Error handling

Routes should not contain large blocks of business logic.

Business logic should be testable independently of HTTP and database concerns wherever practical.

Avoid:

- Giant route files
- Duplicate query logic
- Direct database calls scattered across the application
- Inconsistent error responses
- Unvalidated request parameters
- Unsafe dynamic SQL
- Business rules duplicated between endpoints

Use appropriate HTTP methods and status codes.

Keep API contracts predictable and documented.

Create shared response types where appropriate, but avoid unnecessary coupling between the frontend and backend implementation details.

---

## 7. Database and Data Access Standards

Design the database for correctness and efficient querying.

- Use appropriate data types.
- Define primary keys.
- Define unique constraints where required.
- Define indexes for frequently queried fields.
- Avoid unnecessary indexes.
- Prevent duplicate employee identifiers.
- Ensure data integrity.
- Use transactions for operations that require atomicity.
- Avoid N+1 query problems.
- Avoid loading all employees into memory for operations that can be performed by the database.
- Use database aggregations for analytics when practical.
- Avoid unnecessary database round trips.

Do not use inefficient query patterns simply because the seeded dataset is currently small.

For employee search, filters, sorting and pagination, use the database/API rather than loading the entire employee dataset into the frontend.

Use safe, whitelisted sorting fields.

Document any significant indexing or query decisions.

---

## 8. Performance Standards

The application must handle 10,000+ employees without degrading user experience.

Treat performance as part of implementation, not a last-minute optimization.

### Frontend

- Do not load all employees at once.
- Implement server-side pagination.
- Implement server-side filtering and sorting.
- Debounce search requests.
- Avoid unnecessary network requests.
- Use appropriate caching.
- Avoid unnecessary re-renders.
- Avoid expensive calculations during every render.
- Keep component state minimal.
- Do not introduce memoization everywhere without a reason.
- Use efficient table rendering.
- Keep chart payloads aggregated and small.

### Backend

- Use efficient database queries.
- Add appropriate indexes.
- Avoid fetching unnecessary columns.
- Avoid N+1 queries.
- Perform aggregations at the database level when appropriate.
- Validate pagination parameters and enforce reasonable limits.
- Prevent unbounded result sets.
- Avoid expensive operations on every API request when caching or precomputation is justified.

### Analytics

Do not fetch all employee records to calculate dashboard metrics.

Use aggregation queries or appropriately optimized analytical services.

Ensure that analytics filters are applied consistently.

### Performance validation

Do not make unsupported claims such as "handles 10,000 employees easily."

Validate relevant performance behavior.

Document:

- Query strategy
- Indexes
- Pagination strategy
- Performance assumptions
- Known bottlenecks
- Areas that would require changes at substantially larger scale

Avoid introducing Redis, microservices, distributed processing, or complex infrastructure unless measurements or requirements justify them.

---

## 9. Maintainability and Code Readability

Code should be written for the next engineer who needs to maintain it.

- Use descriptive variable, function and component names.
- Prefer simple code over clever code.
- Keep functions focused and reasonably sized.
- Avoid deeply nested logic.
- Avoid magic numbers.
- Avoid unexplained constants.
- Avoid unnecessary comments that repeat what the code already says.
- Add comments to explain non-obvious decisions and trade-offs.
- Avoid duplicated logic.
- Avoid premature abstractions.
- Avoid overengineering.
- Remove dead code.
- Remove unused dependencies.
- Keep import organization consistent.

If a function is difficult to understand, simplify it before adding comments to explain its complexity.

Do not write code solely to satisfy the current screen. Consider whether the logic will be reused or extended by other features.

---

## 10. Error Handling

Implement consistent and predictable error handling.

- Validate inputs at boundaries.
- Use typed errors or structured error handling where appropriate.
- Handle API failures explicitly.
- Do not silently swallow errors.
- Do not expose internal stack traces or sensitive database details to the frontend.
- Provide user-friendly error messages.
- Log useful information for debugging.
- Ensure error states do not leave the UI inconsistent.

Avoid empty catch blocks.

---

## 11. Testing and Testability

Write code that is naturally testable.

Prefer pure functions for calculations and business rules.

Avoid tightly coupling UI components to implementation details.

Test:

- Business logic
- Validation
- API behavior
- Critical user workflows
- Edge cases

Do not write tests that merely repeat implementation details.

Do not mock everything. Use unit tests for isolated logic and integration tests for meaningful boundaries.

Keep tests deterministic.

Ensure tests do not depend on the order in which they run or on uncontrolled database state.

Do not sacrifice code quality merely to make a test easier to write.

---

## 12. Code Review Before Every Milestone

Before completing each major feature or milestone, review the code as if you were a senior engineer reviewing a pull request.

Check:

- Does every file have a clear responsibility?
- Is any component too large or handling unrelated concerns?
- Is business logic unnecessarily embedded in UI?
- Is there duplicated code?
- Are abstractions justified?
- Are types accurate and useful?
- Are errors handled?
- Are edge cases covered?
- Are there unnecessary API calls?
- Are there inefficient database queries?
- Is pagination truly server-side?
- Are filters and sorting applied safely?
- Are accessibility basics addressed?
- Are tests meaningful?
- Is there any dead code?
- Is there any unnecessary dependency?
- Is the solution more complicated than it needs to be?

Refactor problems you find before moving to the next phase.

Do not defer obvious code quality issues to the end.

---

## 13. Definition of Done

A feature is not complete merely because it works in the happy path.

Before marking a feature complete, ensure:

- Functionality works end-to-end.
- Code is properly structured.
- Components and logic have appropriate separation.
- Validation exists.
- Loading, empty and error states are handled.
- Relevant tests pass.
- Type checking passes.
- Linting passes.
- No obvious performance issues exist.
- No dead code or unnecessary abstractions remain.
- The implementation is understandable and maintainable.
- Documentation is updated where necessary.

Apply this Definition of Done to every feature throughout the project, not only during the final review.

---

### Avoid AI-generated code complexity

Do not optimize for generating code quickly or creating an impressive-looking architecture.

Optimize for code that a competent engineer can easily read, debug, review, and extend.

Before introducing any abstraction, ask:
- Is this actually reused?
- Does this reduce complexity?
- Does this improve maintainability?
- Would a simpler implementation be easier to understand?

Avoid:
- Generic abstractions used only once
- Excessive custom hooks
- Wrapper components that add no value
- Multiple layers of indirection
- Unnecessary design patterns
- Overly large components
- Overly fragmented code
- Unnecessary dependencies

Balance modularity with simplicity.

Every architectural decision should solve a real problem in this application.

When reviewing code, prefer simplifying existing code over adding another abstraction to fix it.

---

## Developer Experience & Learning

The developer has approximately 6 years of experience with React, JavaScript, TypeScript, HTML, CSS, Styled Components, and Flutter.

They are comfortable with frontend development but are relatively new to Vite, TanStack Query, Recharts, and Vitest.

Do not avoid these tools if they are technically appropriate, but introduce them pragmatically.

For any unfamiliar tool or library:

- Briefly explain what problem it solves before introducing it.
- Prefer conventional usage over advanced patterns.
- Avoid unnecessary abstractions and complex configurations.
- Explain important implementation choices in simple terms.
- Provide a concise explanation of the key files and concepts after implementing a major feature.
- Do not turn the project into a tutorial or overwhelm the developer with lengthy explanations.
- Keep the code at a level that an experienced React developer can understand, maintain, and confidently explain in an interview.

The developer has previously used Jest. Vitest is acceptable because its API is very similar to Jest and it integrates well with Vite. Use Jest only if there is a strong reason to do so.

The developer is expected to review and understand the code, architecture, tests, and trade-offs rather than blindly accept AI-generated changes.

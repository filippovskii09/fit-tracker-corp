---
name: testing-standards
description: >
  Apply frontend testing standards when planning, writing, fixing, or extending
  tests for JavaScript/TypeScript React applications. Use for unit tests,
  component/integration tests, regression tests, E2E tests, mocks, fixtures,
  MSW handlers, coverage work, Jest, Vitest, React Testing Library, or Playwright.
---

# Testing Standards

Use the project's existing test stack, helpers, setup, fixtures, naming, and
conventions before introducing new patterns.

The goal is confidence in product behavior with the smallest maintainable test
set—not maximum test count or coverage percentage.

## Decision flow

1. Inspect the code under test and nearby tests.
2. Discover existing render wrappers, setup files, fixtures/factories, MSW
   handlers, test utilities, scripts, and runner configuration.
3. Identify the behavior and the failure/regression the test must detect.
4. Choose the lowest-cost test level that proves that behavior with sufficient
   confidence.
5. Reuse project test infrastructure before creating new helpers.
6. Write the smallest high-signal test set.
7. Run targeted tests first; run broader required gates at completion/CI.

## Choose the test level

- Pure calculations, transformations, validators, reducers, helpers:
  read `references/unit.md`.
- React components, hooks, routing, providers, forms, async UI:
  read `references/component-integration.md`.
- HTTP/API behavior in frontend tests:
  also read `references/mocking-msw.md`.
- Critical cross-page/browser flows:
  read `references/e2e-playwright.md`.
- Coverage analysis or threshold work:
  read `references/coverage.md`.
- Test setup, wrappers, fixtures, file organization, or suite maintainability:
  read `references/test-architecture.md`.

A task may require more than one reference. Load only the relevant ones.

## Core rules

- Test observable behavior and contracts, not private implementation details.
- Prefer fewer high-signal tests over many weak tests.
- Do not duplicate the same confidence across unit, integration, and E2E
  without a concrete reason.
- Add regression coverage at the cheapest level that reliably reproduces the bug.
- Keep tests deterministic, isolated, and independent of execution order.
- Avoid real network calls in unit/component tests.
- Avoid fixed sleeps and timing assumptions.
- Mock external boundaries when needed; do not mock internal modules by default.
- Reuse existing project wrappers, fixtures, handlers, and test utilities.
- Do not expose production internals or redesign public APIs solely for tests.
- Do not add snapshots by default.
- Do not add assertions merely to increase coverage.
- Do not migrate Jest ↔ Vitest or replace the project's testing stack as a
  side effect of a feature/test task.

## Runner rule

Use the runner already configured by the project:

- Jest project → Jest APIs/configuration.
- Vitest project → Vitest APIs/configuration.

Do not mix runner-specific APIs in the same project unless the repository
explicitly supports both.

## Verification

During implementation:

- run the narrowest affected test command.

Before completion:

- run the repository's required relevant test suite;
- run coverage only when required by the task/project gate;
- report failures, skipped checks, and remaining behavior gaps explicitly.

Deterministic CI/test gates take precedence over AI judgment.

# Test Architecture

Keep test code maintainable as production code evolves.

## Repository-first rule

Before creating anything new, inspect:

- nearby test files;
- global/setup files;
- custom render utilities;
- router/i18n/theme/query wrappers;
- MSW server/worker and handlers;
- fixtures/factories/builders;
- shared constants/messages;
- test scripts and runner config.

Prefer the repository's established infrastructure unless it is demonstrably
causing the problem being solved.

## Structure

- Organize tests around behavior/use cases, not implementation methods.
- Keep `describe` nesting shallow.
- Keep each test focused on one coherent behavior.
- Split a suite when it contains unrelated responsibilities or requires
  materially different setup; do not use an arbitrary line-count rule.
- Prefer small factories/builders with scenario overrides over giant duplicated fixtures.
- Avoid shared mutable state across tests.
- Keep setup local unless repetition demonstrates a real shared abstraction.

## Source of truth

- Reuse real constants, messages, enums, fixtures, and domain vocabulary where
  the test is asserting a product-owned value.
- Do not hand-copy a source-owned string/config value into a test if it can be
  referenced from its real source.
- Arbitrary test-only fixture values may remain literals.

## Speed and determinism

- Prefer targeted lower-level tests when they provide the same confidence.
- Avoid unnecessary full-app renders.
- Avoid repeated expensive global setup.
- Keep tests parallel-safe where the runner/project supports parallelism.
- No hidden dependence on execution order, wall-clock time, or real network.

## Helper rule

Create a helper only when it removes meaningful repeated setup while preserving
test intent. Do not build a mini testing framework inside the repository.

## Suite structure

Use `describe` when tests share a subject, setup, lifecycle, or terminology.

Do not add `describe` only for visual nesting when a small file is already clear.

## Setup and cleanup ownership

Keep setup/cleanup at the narrowest shared scope.

- one test -> inside that test;
- several tests in one suite -> `beforeEach` / `afterEach` in that suite;
- many unrelated suites requiring the same invariant -> global test setup.

Do not move cleanup into global setup merely to remove a few duplicated lines.

Global cleanup should represent a project-wide testing invariant.

Always restore mutable global state created by a test:
- storage;
- timers;
- globals;
- mocks/spies;
- handlers;
- process/environment overrides.

## Test data and DRY

Do not extract literals merely to remove duplication.

Extract test data when it represents:
- a real shared contract;
- reusable fixture/factory;
- repeated complex setup;
- project-wide invariant.

Prefer explicit local values when extraction would hide what the test is proving.

Do not make a test depend on a production constant if sharing that constant could
allow the implementation and test to be wrong in the same way.

## Readability

Tests should expose intent directly.

Avoid inspecting framework internals such as:

`mock.calls[0][1]`

when a semantic assertion, named variable, matcher, MSW handler, or helper can
express the behavior more clearly.

Low-level mock inspection is acceptable only when the invocation itself is the
contract under test.

## Isolation contracts

When behavior is scoped by a meaningful identity or key — such as user, tenant,
route, view, cache key, or persisted namespace — add an isolation case when
cross-scope leakage would be a meaningful regression.

Do not duplicate this isolation check at every test layer.
Test it at the cheapest boundary that owns the behavior.

---
name: test-review-standards
description: >
  Independently review frontend tests for behavioral correctness, regression
  protection, test design, determinism, maintainability, mocking quality, and
  project convention reuse. Use for Jest, Vitest, React Testing Library, MSW,
  and Playwright tests. Do not use for writing tests from scratch.
user-invocable: false
---

# Test Review Standards

Determine whether existing tests provide trustworthy, maintainable confidence in
the behavior they claim to protect.

Use `testing-standards` as the underlying implementation standard.

Prioritize correctness and false confidence over style or cosmetic consistency.

## Review workflow

Complete both passes before producing findings.

### Pass 1 — Behavioral correctness

Determine whether each test actually protects the behavior it claims to protect.

Use the behavioral rules below for:
- intent fidelity;
- missing meaningful coverage;
- assertion strength;
- regression protection.

### Pass 2 — Test design

For every reviewed test, explicitly determine:

1. whether the test uses the correct level and boundary;
2. whether established project test/mocking infrastructure is reused;
3. whether the test is coupled to unrelated production/domain details;
4. whether setup and cleanup have the correct ownership/scope;
5. whether behavior is asserted semantically instead of through framework/mock internals.

Use the test-design rules and relevant references below.

Do not finish the review until both passes are complete.
Do not output the checklist itself; output only evidence-backed findings.

## Mandatory reference routing

When tests involve HTTP/network behavior, load:

`testing-standards/references/mocking-msw.md`

When tests involve setup, cleanup, globals, fixtures, mocks, suite structure,
shared infrastructure, or direct mock-call inspection, load:

`testing-standards/references/test-architecture.md`

Load other `testing-standards` references only when relevant to the reviewed tests.

## Regression verification

For important suspected coverage gaps, when cheap and safe, verify the finding by
temporarily introducing the smallest realistic regression in the related
production code and running the targeted tests.

Restore production code immediately after each check.

Prefer findings that can demonstrate:
"this realistic regression still leaves the relevant tests green."

Do not mutation-test exhaustively or mutate unrelated code.

# Behavioral correctness

## Intent fidelity

For each meaningful test determine:

- what the test name claims;
- what the assertions actually prove;
- whether those match.

Flag tests that:

- stay green while the claimed behavior can be broken;
- assert setup instead of outcome;
- prove only that a mock was called when observable behavior matters;
- rely on assertions too weak to establish the stated contract;
- test implementation details instead of relevant behavior.

A passing test is not evidence that the test is useful.

## Behavioral coverage

Look for missing behavior that creates a realistic regression risk:

- primary behavior;
- important negative/error behavior;
- business-critical branches;
- permissions/visibility;
- meaningful state transitions;
- confirmed bug regression cases.

Do not request every theoretical edge case.

Report a coverage gap only when you can identify:

1. the missing behavior;
2. the realistic regression;
3. why current tests would not catch it.

## Assertions

Assertions must directly prove the claimed behavior.

Flag:

- vague assertions when a precise one exists;
- snapshot-only behavioral tests;
- irrelevant call-count assertions;
- implementation-only DOM assertions;
- missing negative assertions where absence is part of the contract;
- tests that verify only part of the behavior stated in their name.

For public errors or returned objects, verify important contract fields when
regressions in those fields would matter.

Prefer semantic/user-visible assertions for UI behavior.

# Test design

## Test level

Use the cheapest level that still provides adequate confidence:

- unit → pure logic and dense edge cases;
- component/integration → React behavior, hooks, providers, forms, routing,
  state transitions, API boundaries;
- E2E → critical browser/application journeys.

Flag:

- E2E for behavior reliably covered below browser level;
- isolated unit tests that mostly reproduce framework behavior;
- duplicated confidence across levels without a concrete reason.

Do not request level changes for theoretical purity.

## Determinism and flakiness

Look for:

- fixed sleeps/arbitrary timeouts;
- hidden timing assumptions;
- race-prone async assertions;
- shared mutable state;
- execution-order dependency;
- uncontrolled timers;
- stale mocks or handlers;
- real network in unit/component tests;
- retries masking nondeterminism.

A retry is not a fix for a flaky test.

## React Testing Library

When relevant, verify that tests:

- prefer user-facing semantic queries;
- use role/accessibility semantics where practical;
- use `userEvent` for interactions;
- handle async behavior correctly;
- avoid CSS selectors/DOM traversal as the primary contract;
- avoid unnecessary manual `act`;
- do not mock React built-in hooks.

If meaningful UI cannot be queried semantically, consider whether the production
markup has an accessibility problem before suggesting brittle selectors.

## MSW and network mocking

When the project already uses MSW:

- prefer the network boundary over bespoke `fetch`/client mocks;
- reuse existing server/handlers infrastructure;
- keep scenario overrides isolated and reset them correctly;
- assert request shape only when request shape is owned by the subject;
- avoid deep-mocking request clients when boundary mocking provides stronger
  confidence.

Generic HTTP/infrastructure tests should use domain-neutral endpoints/data unless
a real domain contract is specifically under test.

Do not introduce React Query or another higher-level abstraction into a test of
a lower-level HTTP client.

## Playwright / E2E

When relevant, verify that tests:

- cover a browser/application-level contract;
- use resilient user-facing locators;
- remain isolated;
- avoid test-order dependencies;
- rely on Playwright waiting/assertion mechanisms rather than sleeps;
- reuse existing fixtures/auth/setup;
- remain focused instead of becoming long multi-purpose journeys.

Do not require multiple browsers unless project compatibility requirements justify it.

## Project infrastructure

Before suggesting new helpers or patterns inspect existing:

- nearby tests;
- render wrappers;
- router/i18n/theme/query helpers;
- setup files;
- MSW infrastructure;
- fixtures/factories/builders;
- Playwright fixtures;
- Jest/Vitest configuration.

Reuse established infrastructure when it already solves the problem.

Project conventions override generic preferences unless they create a concrete
correctness or maintainability issue.

## Architecture and maintainability

Check whether tests:

- use the narrowest appropriate setup/cleanup scope;
- restore mutated global state;
- duplicate project-wide setup;
- over-abstract simple data for DRY;
- share production constants in ways that make tests tautological;
- inspect mock internals when a semantic assertion would be clearer;
- test the abstraction at the correct boundary;
- couple generic infrastructure tests to unrelated business features.

Also look for:

- monolithic suites with unrelated behaviors;
- excessive nested `describe`;
- duplicated large setup;
- large mutable fixtures;
- helpers that hide test intent;
- unnecessary full-app renders;
- duplicated provider setup;
- abstractions harder to understand than the tests they replace.

Use `describe` when tests share a meaningful subject, lifecycle, or setup.
Do not require it merely for visual nesting.

Do not extract literals/helpers merely to remove duplication.
Extract when they represent reusable setup, fixtures, contracts, or meaningful
shared behavior.

Do not split tests based on arbitrary line-count thresholds.

## Coverage

Coverage is evidence, not proof of quality.

When available:

- inspect meaningful uncovered branches;
- correlate gaps with product risk;
- respect configured thresholds.

Do not:

- demand 100% by default;
- add meaningless tests for percentages;
- lower thresholds to make CI green;
- test generated/dead code solely for coverage.

Tooling/CI owns deterministic coverage thresholds.

# Findings

## Severity

**High**

Significant false confidence or CI unreliability, such as:

- critical behavior claimed but not actually verified;
- critical changed behavior effectively uncovered;
- deterministic test silently missing a serious regression;
- systemic flakiness in required tests.

**Medium**

Meaningful confidence or maintainability degradation, such as:

- important behavioral gap;
- wrong test boundary;
- over-mocking;
- bypassing established test infrastructure;
- fragile shared setup.

**Low**

Use sparingly for concrete localized maintenance cost:

- poor readability;
- minor unnecessary duplication;
- small harmful convention inconsistency.

Do not report cosmetic preferences.

## Finding format

Every finding must include:

1. **Evidence** — exact test/file/behavior.
2. **Problem** — what is wrong.
3. **Impact** — realistic regression, false confidence, flake, or maintenance cost.
4. **Fix direction** — smallest practical correction.

Do not report speculative findings without evidence.

## Guardrails

- Review; do not silently rewrite tests.
- Do not request tests without a concrete behavior gap.
- Do not chase coverage percentages.
- Do not weaken assertions to make tests pass.
- Do not suggest skip/retries/exclusions as the default fix.
- Do not enforce personal style over project conventions.
- Do not duplicate lint/typecheck findings unless they expose a broader
  test-design problem.
- Prefer a few high-signal findings over exhaustive checklist output.
- State uncertainty when required context is unavailable.

## Clean review

Return no finding when tests are behaviorally meaningful, deterministic,
appropriately scoped, and maintainable.

Do not invent low-severity feedback merely to produce review output.

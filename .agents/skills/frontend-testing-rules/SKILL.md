---
name: frontend-testing-rules
description: Use when writing, editing, or reviewing frontend tests with React Testing Library, Jest, Vitest, component tests, hooks tests, providers, fixtures, mocks, or test coverage requirements. Enforces behavior-first tests, semantic queries, deterministic async handling, provider wrappers, and domain constants/messages reuse.
---

# Frontend Testing Rules

Use this skill for frontend test implementation and test refactors.

## Scope

Apply only to test files, test utilities, fixtures, mocks, and test setup unless the user explicitly approves a production-code testability fix.

## Rule Files

Read and follow:

1. [`rules/core.md`](rules/core.md) for the complete frontend testing policy.
2. [`../common-agent-rules/rules/common.md`](../common-agent-rules/rules/common.md) for shared safety, reporting, naming, import ordering, and readability rules.

## Required Workflow

1. Confirm the requested test target and avoid unrelated areas.
2. Discover existing constants, messages, fixtures, mocks, and test utilities before writing assertions.
3. Prefer behavior-focused RTL tests using `screen`, semantic queries, `userEvent`, and `jest-dom` matchers.
4. Cover positive, negative, edge, empty, and non-empty states where relevant.
5. Validate relevant tests or state what could not be run.

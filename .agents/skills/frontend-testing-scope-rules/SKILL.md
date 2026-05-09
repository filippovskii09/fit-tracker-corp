---
name: frontend-testing-scope-rules
description: Use with frontend-testing-rules for focused test tasks involving scoped queries, dropdowns, modals, table rows, filtering assertions, URL setup helpers, message constants, and realistic user interactions. Enforces localized within queries and negative assertions.
---

# Frontend Testing Scope Rules

Use this skill as an add-on to `frontend-testing-rules` when tests involve repeated UI regions, dropdowns, modals, filters, tables, cards, or route/query setup.

## Rule Files

Read and follow:

1. [`rules/scope-first.md`](rules/scope-first.md)
2. [`../frontend-testing-rules/rules/core.md`](../frontend-testing-rules/rules/core.md)

## Required Workflow

1. Identify the user-visible container where each interaction belongs.
2. Use `within(container)` for scoped elements instead of global `screen` when duplicates can exist.
3. For filtering, assert expected items are visible, unexpected items are absent, and rendered count is correct.
4. Use utilities for URL, route, and mock setup instead of hardcoded setup strings.
5. Open interactive UI before querying its contents, even if the DOM exists before interaction.

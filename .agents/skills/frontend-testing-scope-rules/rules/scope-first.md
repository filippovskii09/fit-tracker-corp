# Frontend Testing Scope-First Rules

Scope: tests only. Do not touch production code unless a testability fix is explicitly requested.

## 1. Scope-First Queries

- MUST avoid global `screen` queries when the target element logically belongs inside a specific container such as a dropdown, modal, table row, card, or filter group.
- MUST use `within(container)` to ensure the test interacts with the element the user sees in that specific context.
- SHOULD first locate the container by user-visible semantics, then query inside it.

## 2. Negative Assertions And Data Integrity

- MUST NOT consider a filtering test complete if it only checks that expected items are present.
- MUST verify:
  - expected data is visible,
  - all other initial data is absent,
  - the exact number of rendered rows/cards/items is correct.
- SHOULD create helpers such as `assertAssetsOnlyVisible` when the same integrity check is repeated.

## 3. Utility-Driven Test Setup

- MUST move complex environment setup into pure test utilities.
- SHOULD use helpers such as `buildUrlWithTags` instead of hardcoded `initialEntries` strings.
- MUST keep setup utilities deterministic and independent from production behavior changes.

## 4. Semantic Labeling And Messages

- MUST NOT use magic strings for finding UI such as `/Search tags/i` when a project message or constant exists.
- MUST import labels from component `messages.*`, constants, fixtures, or mocks where available.
- SHOULD let tests fail when product copy or requirements change, instead of silently preserving stale hardcoded text.

## 5. Interaction Realism

- MUST emulate the full user path, including helper actions required to expose UI.
- MUST open dropdowns, menus, accordions, modals, and similar interactive elements with `userEvent` before querying their contents.
- MUST use `findBy*` for elements that appear after animation, async rendering, or requests.

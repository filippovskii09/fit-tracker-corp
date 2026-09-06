# Component / Integration Tests

Use React Testing Library for user-visible React behavior and integration
between components, hooks, providers, routing, forms, and mocked network
boundaries.

## Query strategy

Prefer queries that reflect how users and assistive technology find elements:

1. `getByRole` / `findByRole`
2. label, placeholder, text, display value
3. alt text / title
4. `data-testid` only when semantic queries are not practical

Use `screen` by default. Use `within()` to scope repeated regions.

Do not use CSS classes, DOM traversal, or `querySelector` as the primary way to
prove behavior.

## Interaction

- Prefer `userEvent.setup()` and user-level interactions.
- Use `findBy*` for async appearance.
- Use `queryBy*` for non-existence.
- Use `waitFor` only around a concrete assertion that must eventually become true.
- Do not put side effects inside `waitFor`.
- Do not use fixed sleeps.
- Do not manually wrap ordinary RTL/user-event flows in `act`; use `act` only
  where the testing tool cannot manage the update, such as explicit timer control.

## What to prove

- initial user-visible state when relevant;
- user action;
- resulting visible/accessible behavior;
- loading/error/empty/success states when they are part of the contract;
- both presence and absence for filtering, permissions, or conditional UI.

## Project infrastructure

Before writing setup:

- find and reuse the project's custom `render`;
- reuse router/i18n/theme/query/provider wrappers;
- reuse existing fixtures/factories and test constants;
- reuse existing MSW setup and handlers.

Do not inline large provider trees repeatedly.

## Hooks

- Prefer testing a component-visible outcome when a hook only serves that component.
- Use `renderHook` for reusable hooks whose public hook contract itself needs
  independent coverage.
- Do not call hooks as ordinary functions.
- Do not mock built-in React hooks such as `useState` or `useEffect`.

## Anti-patterns

- testing component internals;
- mocking child components by default;
- asserting utility classes;
- broad snapshots instead of behavior;
- tests that only prove a mock was called without proving the resulting behavior.


## User interaction

For real user interactions, prefer `userEvent` over `fireEvent`.

Create the interaction session before rendering:

const user = userEvent.setup();
render(...);

await user.click(...);

Use `fireEvent` only when low-level event dispatch itself is the contract or
`userEvent` cannot represent the required interaction.

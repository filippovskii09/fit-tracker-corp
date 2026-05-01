# Frontend Testing Rules

Rules for dedicated frontend testing work.

Enforcement levels:
- MUST: mandatory
- SHOULD: expected default
- MAY: optional

## 1. Mission

- MUST write and edit tests only.
- MUST NOT change production behavior unless a testability fix is explicitly approved.

## 2. Scope

- MUST focus on the requested testing task scope only.
- MUST explicitly avoid out-of-scope areas.

## 3. Coverage And Definition Of Done

- MUST ensure tests are valid and deterministic.
- MUST target at least 90% coverage for the requested target area.
- MUST cover positive, negative, and edge cases for target behavior.
- MUST include empty and non-empty states where relevant.

## 4. Testing Philosophy

- MUST test behavior, not implementation details.
- MUST validate user-visible outcomes.
- MUST target interactions the way a user perceives the interface: query buttons, inputs, links, and controls by accessible name, visible text, label, placeholder, or role state instead of positional indexes such as `buttons[0]` whenever the UI exposes a meaningful label or icon description.
- SHOULD prefer integration-style component tests over low-value unit internals when both are possible.
- MUST use isolated unit tests for complex business logic, pure functions, calculations, and specific edge cases where integration tests would be overly cumbersome or fail to provide sufficient coverage depth.
- MUST validate initial UI state before user action when the behavior depends on that state.

Example: assert "button not shown", then user clicks, then assert "button appears".

## 5. RTL Query Strategy

### Always Use `screen`

- MUST use `screen` for all queries and debugging.
- MUST NOT destructure query methods from the `render` return value.
- MAY destructure `rerender` and `unmount` from `render`.

```ts
// Bad
const { getByRole } = render(<Example />);
getByRole('alert');

// Good
render(<Example />);
screen.getByRole('alert');
```

### Query Priority

Use queries in this order:

1. `getByRole` / `findByRole`
2. `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue`
3. `getByAltText`, `getByTitle`
4. `getByTestId` only as a last resort

- MUST NOT use `container.querySelector` for primary assertions.
- SHOULD prefer `within(container)` when multiple similar elements exist.

### Accessibility Attributes

- MUST NOT add redundant `role` or `aria-*` attributes to elements that already have the correct implicit ARIA role.
- SHOULD follow WAI-ARIA Authoring Practices for non-native UI that genuinely requires ARIA.
- If an element cannot be queried by role without adding an explicit role, first consider whether the markup should be more semantic.

## 6. Interaction And Async Rules

- MUST use `@testing-library/user-event` for user interactions.
- MUST add `@testing-library/user-event` as a dev dependency when a project does not already provide it, instead of falling back to `fireEvent` for realistic clicks, typing, selection, and keyboard behavior.
- MUST use `findBy*` for async appearance.
- MUST use `waitFor` only with a concrete assertion inside.
- MUST keep side effects outside `waitFor`.
- MUST use `queryBy*` only for non-existence assertions.

## 7. Mocking And Test Data

- MUST NOT mock internal components unless technically required.
- SHOULD mock network on the boundary level; MSW is preferred where applicable.
- MUST globally mock generic browser APIs absent in JSDOM, such as `ResizeObserver`, in setup tests, not individual test files.
- MUST keep business-logic mocks local and deterministic.
- SHOULD use centralized fixtures for complex response payloads instead of large inline object literals.
- MUST keep fixture structure aligned with the real API schema.
- MUST reuse existing project fixtures, constants, messages, and mocks when equivalent values already exist.
- SHOULD build scenario-specific fixtures with small factory helpers instead of duplicating ad-hoc object literals.
- SHOULD name and reuse repeated mock-only labels, numeric values, and scenario values in local fixtures or constants instead of duplicating literals across setup and assertions.

## 8. Assertions And Readability

### Jest-DOM Matchers

- MUST use `@testing-library/jest-dom` semantic matchers instead of checking raw DOM properties.

Prefer:
- `toBeDisabled()` over `.disabled === true`
- `toHaveTextContent()` over `.textContent === 'foo'`
- `toBeVisible()` over `getComputedStyle(el).display !== 'none'`
- `toBeInTheDocument()` over `el !== null`

### General Assertions

- MUST prefer readable extraction over positional chains like `mock.calls[0][1]`.
- SHOULD use named helpers for call argument extraction when needed.
- SHOULD prefer object-level assertions such as `toEqual`, `toMatchObject`, and `objectContaining` when this improves clarity.
- MUST keep explicit field assertions for business-critical or optional/omitted fields where object-level assertions can hide regressions.
- MUST align assertions with test intent.
- For wrapper or factory tests, assert the prop-forwarding contract first, not mock placeholder markup.
- MUST NOT use hardcoded mock-only labels or text in assertions when they do not represent real product behavior.
- MUST prefer values from fixtures, mocks, constants, and messages over ad-hoc literal strings.
- SHOULD scope assertions with `within` when multiple instances exist.

## 9. `act` Usage

- MUST NOT wrap `render` or standard `userEvent` flows in manual `act`.
- MUST use `act` for explicit timer advancement.

```ts
act(() => {
  jest.advanceTimersByTime(500);
});
```

## 10. Stability And Speed

- MUST avoid flaky assertions and race-prone timing assumptions.
- SHOULD keep tests small and parallelizable.
- SHOULD avoid heavy setup per test when shared setup is possible.

## 11. Domain Consistency

Before writing or refactoring assertions, MUST run a constants/messages discovery step:

1. Check feature-local `constants.*`, `messages.*`, and `__mocks__/**/*`.
2. Search within the target feature for exported constants, enums, and messages.
3. Reuse equivalent values.

- MUST use project constants/enums instead of hardcoded domain strings.
- MUST use project i18n messages when UI text is message-driven.
- MAY use hardcoded strings only if no constant/message exists, and this must be justified in the summary or PR description.

## 12. Style Conventions

- MUST follow Arrange, Act, Assert structure.
- SHOULD keep `describe` blocks shallow.
- MUST use descriptive test names based on use case.
- MUST double-check that each test body matches its description.
- MUST NOT add boilerplate cleanup if the framework handles it automatically.
- MUST NOT assert or query by CSS utility classes.
- MUST rely on React Testing Library semantics rather than DOM structure traversal.
- MUST NOT use DOM traversal like `.closest('.utility-class')` or `.parentElement`.

## 13. Custom Hooks Testing

### Default Approach

- SHOULD test hooks through a real component that uses them and assert visible behavior.
- Use `renderHook` only when the hook has many independent edge cases or is shared/published and needs a stable contract test independent of a specific UI.
- One-off hooks extracted only to keep a component body clean are usually covered by the component test.

### `renderHook` Rules

- MUST access hook return values via `result.current`.
- MUST wrap any call that triggers a state update in `act`.
- MUST use `waitFor` for async hooks.
- For React 18 and `@testing-library/react` >= 13.1, import `renderHook` and `act` from `@testing-library/react`.
- For React 16/17 legacy projects, importing from `@testing-library/react-hooks` is a justified exception.

### Props Changes And Cleanup

- SHOULD use `rerender` from `renderHook` to test changing arguments.
- SHOULD use `unmount` to test cleanup functions.

### Context And Providers

- MUST pass a wrapper to `renderHook` when the hook depends on React context.
- MUST NOT mock the context value directly; use the real Provider.

### Hard Prohibitions

- MUST NOT call a custom hook as a plain function in a test.
- MUST NOT mock built-in React hooks such as `useState` or `useEffect`.

## 14. Provider And Context Wrapping

### Custom Render Utility

- MUST NOT inline provider boilerplate directly in individual test files.
- MUST create or reuse a shared `renderWithProviders` or `customRender` test utility for common providers.
- SHOULD add reusable provider-specific helpers, such as `renderWithFormik`, to shared test utilities when the same wrapper is likely to be reused across multiple component or hook tests.
- SHOULD re-export RTL helpers and `userEvent` from that same test utility so tests import from one place.

### QueryClient Isolation

- MUST create a new `QueryClient` instance inside the wrapper component so each render gets a fresh client.
- MUST set `retry: false` in test QueryClient options.
- MUST NOT share a singleton QueryClient across tests.

### Router

- MUST use `MemoryRouter`, not `BrowserRouter`, in tests.
- SHOULD expose a `route` or `initialEntries` option in `renderWithProviders` for route-dependent components.

### Wrapper Contents

- Include only providers required by most components in the shared wrapper.
- MUST NOT add providers needed by only one or two tests to the global wrapper; use a local wrapper option instead.

---
trigger: manual
---

# Frontend Testing Rules

> Rules for the dedicated **testing chat**.
> Enforcement levels: **MUST** = mandatory · **SHOULD** = expected default · **MAY** = optional.

---

## 1. Mission

- **MUST** write and edit tests only.
- **MUST NOT** change production behavior unless a testability fix is explicitly approved.

---

## 2. Scope

- **MUST** focus on the requested testing task scope only.
- **MUST** explicitly avoid out-of-scope areas.

---

## 3. Coverage & Definition of Done

- **MUST** ensure tests are valid and deterministic.
- **MUST** target at least **90% coverage** for the requested target area.
- **MUST** cover positive, negative, and edge cases for target behavior.
- **MUST** include empty/non-empty states where relevant.

---

## 4. Testing Philosophy

- **MUST** test **behavior**, not implementation details.
- **MUST** validate user-visible outcomes.
- **SHOULD** prefer integration-style component tests over low-value unit internals when both are possible.
- **MUST** use isolated unit tests for complex business logic, pure functions, calculations, and specific edge cases where integration tests would be overly cumbersome or fail to provide sufficient coverage depth.
- **MUST** validate initial UI state before user action when the behavior depends on that state.

> **Example:** assert "button not shown" → user clicks → "button appears".

---

## 5. RTL Query Strategy

### 5.1 Always use `screen`

- **MUST** use `screen` for all queries and debugging — do **not** destructure query methods from the `render` return value.
- Exception: `rerender`, `unmount` may be destructured from `render`.

```ts
// ❌
const { getByRole } = render(<Example />)
getByRole('alert')

// ✅
render(<Example />)
screen.getByRole('alert')
```

### 5.2 Query priority order

Use queries in **strict priority order**:

| Priority | Query |
|----------|-------|
| 1 ✅ | `getByRole` / `findByRole` |
| 2 | `getByLabelText`, `getByPlaceholderText`, `getByText`, `getByDisplayValue` |
| 3 | `getByAltText`, `getByTitle` |
| 4 ⚠️ last resort | `getByTestId` |

- **MUST NOT** use `container.querySelector` for primary assertions.
- **SHOULD** prefer `within(container)` when multiple similar elements exist to ensure the test targets the correct instance.
- **MUST** treat `data-testid` as an explicit fallback for UI that has no stable accessible surface, such as skeletons, decorative loaders, virtualized placeholders, or third-party markup where the accessible contract is intentionally absent.
- **MUST** keep `data-testid` names domain-specific and stable when they are necessary. Prefer `workout-details-skeleton` over generic names like `loader` or `box-1`.

### 5.3 Accessibility attributes

- **MUST NOT** add redundant `role` or `aria-*` attributes to elements that already have the correct implicit ARIA role from their HTML semantics.
- **SHOULD** follow [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/) when building non-native UI that genuinely requires ARIA.

```tsx
// ❌ — redundant, <button> already has role="button" implicitly
<button role="button">Click me</button>

// ✅
<button>Click me</button>
```

> If you can't query an element by role without adding an explicit `role`, that's a signal the markup may not be semantic enough — fix the HTML, not the test.

---

## 6. Interaction & Async Rules

- **MUST** use `@testing-library/user-event` for user interactions.
- **MUST** prefer `userEvent` for real user flows: clicking buttons/links, typing, clearing inputs, tabbing, keyboard shortcuts, selecting options, uploading files, and opening menus/dialogs.
- **MAY** use `fireEvent` only for low-level browser events that `userEvent` cannot express well, such as manually dispatching `scroll`, `resize`, `animationEnd`, `transitionEnd`, or custom events. Document why `fireEvent` is needed when the reason is not obvious.
- **MUST** use `findBy*` for async appearance.
- **MUST** use `waitFor` only with a concrete assertion inside.
- **MUST** keep side effects **outside** `waitFor`.
- **MUST** use `queryBy*` only for non-existence assertions.
- **MUST NOT** put `user.click`, `user.type`, mock setup, route changes, or any other side effect inside `waitFor`.

### 6.1 Network-driven UI states

For React Query or request-driven screens, tests should assert the state transition that a user sees:

1. Arrange the boundary mock/hook response.
2. Assert the initial loading, empty, error, or disabled state when that state matters.
3. Use `findBy*` for data that appears after the request settles.
4. Use `waitFor` for non-DOM async state, such as `result.current.isSuccess`, or disappearance assertions that cannot be expressed with `findBy*`.
5. Assert stale/absent UI with `queryBy*` after the concrete loaded/error state is visible.

```ts
render(<WorkoutPage />, { route: '/workouts/1' });

expect(screen.getByTestId('workout-details-skeleton')).toBeInTheDocument();
expect(await screen.findByRole('heading', { name: workoutName })).toBeVisible();
expect(screen.queryByTestId('workout-details-skeleton')).not.toBeInTheDocument();
```

For hook tests, `waitFor` is acceptable when the observable contract is hook state:

```ts
const { result } = renderHook(() => useWorkoutQuery(id));

await waitFor(() => expect(result.current.isSuccess).toBe(true));
expect(result.current.data).toEqual(workout);
```

---

## 7. Mocking & Test Data

- **MUST NOT** mock internal components unless technically required.
- **SHOULD** mock network on boundary level (MSW preferred where applicable).
- **MUST** globally mock generic browser APIs absent in JSDOM (e.g. `ResizeObserver`) in `setupTests` — not in individual test files.
- **MUST** keep business-logic mocks local and deterministic.
- **SHOULD** use centralized fixtures (`JSON`/`TS`) for complex response payloads instead of large inline object literals.
- **MUST** keep fixture structure aligned with the real API schema.
- **MUST** reuse existing project fixtures/constants/messages when equivalent values already exist.
- **SHOULD** build scenario-specific fixtures via small factory helpers instead of duplicating ad-hoc object literals.

---

## 8. Assertions & Readability

### 8.1 Use `jest-dom` semantic matchers

- **MUST** use `@testing-library/jest-dom` matchers instead of checking raw DOM properties — they provide better error messages and express intent more clearly.

```ts
// ❌ — raw DOM property, poor error output
expect(button.disabled).toBe(true)

// ✅ — semantic, clear error message
expect(button).toBeDisabled()
```

Prefer semantic matchers over equivalent raw checks:

| Instead of | Use |
|---|---|
| `.disabled === true` | `.toBeDisabled()` |
| `.textContent === 'foo'` | `.toHaveTextContent('foo')` |
| `getComputedStyle(el).display !== 'none'` | `.toBeVisible()` |
| `el !== null` | `.toBeInTheDocument()` |

### 8.2 General assertion rules

- **MUST** prefer readable extraction over positional chains like `mock.calls[0][1]`.
- **SHOULD** use named helpers for call argument extraction when needed.
- **SHOULD** prefer object-level assertions (`toEqual`, `toMatchObject`, `objectContaining`) for payload checks when this improves clarity.
- **MUST** keep explicit field assertions for business-critical or optional/omitted fields where object-level assertions can hide regressions.
- **MUST** align assertions with test intent.
-   For wrapper/factory tests: assert prop-forwarding contract first, not mock placeholder markup.
- **MUST NOT** use hardcoded mock-only labels/text in assertions when they do not represent real product behavior.
- **SHOULD** extract shared mock labels/selectors into constants if UI presence assertion is still needed.
- **MUST** prefer values from `fixtures` / `mocks` / `constants` / `messages` over ad-hoc literal strings when asserting mock-rendered content.

```ts
// ✅ prefer
expect(someEl).toHaveTextContent(__mocks__/someModule.label);

// ❌ avoid
expect(someEl).toHaveTextContent('Some hardcoded label');
```

- **SHOULD** scope assertions to the correct container using `within` when multiple instances exist, to avoid false positives.

---

## 9. `act` Usage

- **MUST NOT** wrap `render` or standard `userEvent` flows in manual `act`.
- **MUST** use `act` for explicit timer advancement:

```ts
// ✅ correct use of act
act(() => {
  jest.advanceTimersByTime(500);
});
```

---

## 10. Stability & Speed

- **MUST** avoid flaky assertions and race-prone timing assumptions.
- **SHOULD** keep tests small and parallelizable.
- **SHOULD** avoid heavy setup per test when shared setup is possible.

### 10.1 Flaky-pattern checklist

Before finishing a frontend test change, verify:

- No fixed sleeps, manual promises, or arbitrary timer advancement unless testing timer behavior directly.
- No side effects inside `waitFor`.
- `waitFor` always contains a concrete assertion.
- Async UI appearance uses `findBy*` instead of `waitFor(() => getBy*)`.
- Disappearance/absence uses `queryBy*` after a positive condition proves the UI reached the expected state.
- Each render gets isolated providers and a fresh React Query client.
- Mocks are reset in `beforeEach` and do not rely on test order.
- Dropdowns, dialogs, popovers, and accordions are opened by the user flow before querying their contents.
- Repeated regions use `within` so a test cannot pass against the wrong card, row, dialog, or list.

---

## 11. Domain Consistency

Before writing or refactoring assertions, **MUST** run a constants/messages discovery step:

1. Check feature-local files first: `constants.*`, `messages.*`, `__mocks__/**/*`.
2. Search within the target feature for exported constants/enums/messages.
3. Reuse them when equivalent.

**MUST** use project constants/enums instead of hardcoded domain strings:

```ts
// ✅
ASSET_CATEGORIES.IMAGE
ASSETS_STATUSES.ACTIVE

// ❌
'image'
'active'
```

**MUST** use project i18n messages when UI text is message-driven:

```ts
// ✅
messages['someKey'].defaultMessage

// ❌
'Some column name'
```

**MAY** use hardcoded strings only if no constant/message exists — this must be justified in the PR/summary.

---

## 12. Style Conventions

- **MUST** follow **AAA** structure (Arrange → Act → Assert).
- **SHOULD** keep `describe` blocks shallow.
- **MUST** use descriptive test names based on use case. Double-check that the test body actually matches its description.
- **MUST NOT** add boilerplate cleanup if the framework handles it automatically.
- **MUST NOT** assert or query by CSS utility classes:

```ts
// ❌ tests implementation detail, not behavior
container.querySelector('.my-3')
container.querySelector('.d-flex')
```

- **MUST** rely on React Testing Library semantics (roles, text, accessible names) rather than DOM structure traversal.
- **MUST NOT** use DOM traversal like `.closest('.utility-class')` or `.parentElement`. Tests should focus on **behavior**, not HTML tree shape.

---

## 13. Custom Hooks Testing

### 13.1 Default approach: test hooks through a component

**SHOULD** test hooks by rendering a real component that uses them and asserting on visible behavior — this mirrors actual usage and gives the most confidence.

Use `renderHook` only when:
- the hook has many independent edge cases that would require many different test components, or
- the hook is published/shared and needs a stable contract test independent of any specific UI.

> If it's a one-off hook extracted only to keep a component body clean — it's covered by the component test. No separate hook test needed.

### 13.2 `renderHook` rules

- **MUST** access hook return values via `result.current`.
- **MUST** wrap any call that triggers a state update in `act()`.
- **MUST** use `waitFor` for async hooks (same rule as §6).

**Import depends on project version:**

| Project version | Import from |
|---|---|
| React 18 + `@testing-library/react` ≥ 13.1 | `import { renderHook, act } from '@testing-library/react'` |
| React 16/17 with old dependencies | `import { renderHook, act } from '@testing-library/react-hooks'` |

> **⚠️ Legacy exception.** `@testing-library/react-hooks` is deprecated for new projects, but remains the only option for projects that cannot upgrade to React 18. In such projects, using this library is a justified exception, not a mistake. The API `result.current`, `act`, `rerender`, `waitFor` is identical in both packages.

```ts
// ✅ React 18 / new project
import { renderHook, act } from '@testing-library/react'

// ✅ React 16/17 / legacy-project (justified exception)
import { renderHook, act } from '@testing-library/react-hooks'

// the same API in both cases:
it('increments the counter', () => {
  const { result } = renderHook(() => useCounter(0))

  act(() => {
    result.current.increment()
  })

  expect(result.current.count).toBe(1)
})
```

### 13.3 Props changes & cleanup

- **SHOULD** use `rerender` (from `renderHook` return value) to test how a hook reacts to changing arguments.
- **SHOULD** use `unmount` to test cleanup functions (e.g. `useEffect` teardown).

```ts
const { result, rerender } = renderHook(
  ({ url }) => useFetch(url),
  { initialProps: { url: '/api/v1' } }
)

rerender({ url: '/api/v2' })

await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2))
```

### 13.4 Hooks that require context / providers

- **MUST** pass a `wrapper` to `renderHook` when the hook depends on a React context.
- **MUST NOT** mock the context value directly — use the real Provider.

```ts
const wrapper = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
)

const { result } = renderHook(() => useAuth(), { wrapper })

expect(result.current).toHaveProperty('user')
```

### 13.5 Hard prohibitions

- **MUST NOT** call a custom hook as a plain function in a test — this breaks the Rules of Hooks.
- **MUST NOT** mock built-in React hooks (`useState`, `useEffect`, etc.) — you lose all confidence in the actual behavior.

---

## 14. Provider / Context Wrapping

### 14.1 Always use a custom render utility

- **MUST NOT** inline provider boilerplate (`<QueryClientProvider>`, `<MemoryRouter>`, `<IntlProvider>`, etc.) directly in individual test files.
- **MUST** create a `renderWithProviders` (or `customRender`) utility in a shared test-utils file that wraps all required providers.
- **SHOULD** re-export everything from `@testing-library/react` from that same file — tests should import from one place, not two.

```ts
// ✅ single import source for all tests
import { render, screen, waitFor, userEvent } from '@/test-utils'

// ❌ mixing RTL direct imports with custom render
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test-utils'
```

### 14.2 QueryClient isolation

- **MUST** create a **new** `QueryClient` instance **inside** the Wrapper component (not outside), so each `render` call gets a fresh client with no shared cache state.
- **MUST** set `retry: false` in test QueryClient — retries cause flaky, slow tests.

```ts
// ✅ fresh client per render, no state leakage between tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

const Wrapper = ({ children }) => {
  const queryClient = createTestQueryClient() // inside Wrapper ← critical
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// ❌ shared singleton — causes state leakage between tests
const queryClient = new QueryClient() // outside Wrapper
```

### 14.3 Router in tests

- **MUST** use `MemoryRouter` (not `BrowserRouter`) in tests — it doesn't depend on the real browser history API and is fully isolated.
- **SHOULD** expose a `route` / `initialEntries` option in `renderWithProviders` for components that depend on the current URL.

```ts
// ✅ testing a route-dependent component
render(<AssetList />, { route: '/assets?type=image' })

// Wrapper internally: <MemoryRouter initialEntries={[route]}>
```

### 14.4 What belongs in the wrapper

Include in the shared `Wrapper` only providers that are **required by the majority of components**. Project-specific examples:

| Provider | When to include |
|---|---|
| `QueryClientProvider` | project uses `@tanstack/react-query` |
| `MemoryRouter` | project uses `react-router-dom` |
| `IntlProvider` | project uses i18n (`@edx/frontend-platform/i18n`, `react-intl`) |
| `ThemeProvider` | project uses a CSS-in-JS theme |
| Redux `<Provider store>` | project uses Redux; pass `store` as an option |

Providers needed by only one or two tests **MUST NOT** be added to the global wrapper — use the `wrapper` option directly in that test instead.

---

## 15. MUI Component Testing

The project uses MUI for form controls, dialogs, and selected UI primitives. MUI often renders through portals, applies transitions, and exposes accessible roles through composed components.

- **MUST** query MUI controls by accessible role/name first: `button`, `textbox`, `combobox`, `dialog`, `option`, `menuitem`, `checkbox`, `tab`, `tabpanel`.
- **MUST** open MUI menus, selects, autocomplete poppers, dialogs, and accordions through `userEvent` before querying their contents.
- **MUST** use `findByRole` for portal or transition-rendered content that appears after an interaction.
- **SHOULD** scope dialog assertions with `within(screen.getByRole('dialog'))` when the same labels also exist behind the modal.
- **SHOULD** assert the visible behavior of MUI state instead of internal classes such as `.Mui-expanded`, `.Mui-selected`, or `.Mui-disabled`.
- **MAY** use `fireEvent.mouseDown` only when a MUI primitive cannot be opened by `userEvent.click` because the component listens to a lower-level event. Prefer `userEvent` first and leave a short comment for the exception.
- **MUST NOT** assert on portal container structure, transition wrapper nodes, generated ids, or MUI class names.

Example:

```ts
const user = userEvent.setup();

await user.click(screen.getByRole('button', { name: /delete workout/i }));

const dialog = await screen.findByRole('dialog', { name: /delete workout/i });
await user.click(within(dialog).getByRole('button', { name: /confirm/i }));

expect(onConfirm).toHaveBeenCalledTimes(1);
```

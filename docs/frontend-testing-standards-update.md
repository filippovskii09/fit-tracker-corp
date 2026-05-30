# Frontend Testing Standards Update

## What changed

- Expanded `.agents/rules/frontend-testing.md` with concrete rules for `userEvent` vs `fireEvent`, async request-driven UI, stable selector priority, MUI portals/transitions, and a flaky-test checklist.
- Updated representative RTL tests in workout form and workout page specs to follow the standard:
  - prefer `findBy*` for async appearance instead of `waitFor(() => getBy*)`;
  - keep side effects outside `waitFor`;
  - assert disabled/absent UI with semantic matchers;
  - use project dictionary values instead of hardcoded copy;
  - add count/absence checks where they prove the user-visible result.

## Why it was fixed

The old tests mostly worked, but some patterns were too easy to make flaky or misleading:

- `waitFor` was used where `findBy*` expresses the same async UI expectation more clearly.
- One page test said it verified submit behavior, but it only checked that the submit button existed. It now verifies the actual initial rule: the button is disabled until an exercise is selected.
- Some assertions used copy literals even though the app already has locale constants.

## Notes for future tests

- Use `userEvent` for real user actions. Use `fireEvent` only for low-level events that `userEvent` cannot model.
- Query by role/name first, then label/text, and use `data-testid` only for things like skeletons or non-semantic placeholders.
- For MUI dialogs, menus, selects, and popovers, open the UI first and then query portal content with `findByRole`.
- A test is not stable until async assertions wait for a concrete visible condition and negative assertions happen after the UI reached the expected state.

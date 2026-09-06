# Unit Tests

Use for pure or narrowly isolated logic where framework/browser integration is
not part of the behavior being proved.

## Use for

- pure functions;
- parsers/formatters;
- calculations;
- validators;
- reducers/state transitions;
- utilities/helpers;
- dense edge-case matrices.

## Rules

- Test inputs → observable outputs/errors.
- Cover meaningful boundaries, invalid inputs, and business-critical branches.
- Prefer table-driven cases when many inputs express the same rule.
- Keep fixtures minimal and intention-revealing.
- Do not mock the function's own internal implementation.
- Mock a dependency only when isolation is necessary or the real boundary is
  nondeterministic/slow/external.
- Prefer real values and real collaborators when they are cheap and deterministic.
- Use fake timers only when time itself is part of the contract.
- Do not assert implementation-only call counts unless the call is itself a
  required contract.
- Use the project's runner (Jest or Vitest); do not introduce runner-specific
  abstractions unnecessarily.

## Regression rule

For a bug in pure logic, first add a test that fails for the actual regression,
then fix the implementation.

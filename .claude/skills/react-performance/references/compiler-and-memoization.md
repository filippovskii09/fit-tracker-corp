# React Compiler and manual memoization

## Detect first

Before changing memoization strategy, inspect:

- React version;
- whether React Compiler is configured;
- compiler mode/configuration;
- existing lint/compiler diagnostics.

Do not assume every React project uses the compiler.

## When React Compiler is enabled

React Compiler automatically applies memoization-like optimizations to components and values.

Default for new code:

- write pure, idiomatic React;
- structure state/subscriptions correctly;
- rely on the compiler for routine memoization;
- use manual `useMemo`, `useCallback`, or `memo` only for precise control, semantic identity requirements, third-party API contracts, or measured exceptions.

Do not remove existing manual memoization casually; compiler output/behavior can change when it is removed.

## When React Compiler is not enabled

Still do not blanket-memoize.

### `memo`

Consider when:

- a component is expensive;
- its parent updates frequently for unrelated reasons;
- its props are usually stable;
- profiling/evidence or clear architecture suggests skipping the work matters.

`memo` is an optimization, not a correctness guarantee.

### `useMemo`

Consider when:

- a pure calculation is materially expensive and dependencies change less often;
- stable object/array identity is required for an actual optimization/API dependency.

Do not memoize trivial arithmetic, simple property reads, or small JSX fragments by default.

### `useCallback`

Consider when function identity materially matters:

- passing to a memoized expensive child;
- dependency of another memoized value/effect where stable identity is semantically useful;
- external API subscription identity requirements.

Do not wrap every event handler.

Inline functions are not automatically a performance problem.

## Dependency correctness

Never omit hook dependencies to preserve memoization.

Incorrect dependencies create stale values and bugs and can prevent compiler analysis.

Correctness comes before skipped renders.

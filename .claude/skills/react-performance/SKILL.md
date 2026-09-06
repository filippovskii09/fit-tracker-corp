---
name: react-performance
description: Builds React code with performance-aware architecture by default, minimizing unnecessary renders, state propagation, effects, expensive render work, and client-side update cost without premature memoization. Use when creating or refactoring React components, pages, forms, state ownership, context/providers, selectors, lists, expensive calculations, transitions, deferred UI, or client/server component boundaries; also use when React rendering or interaction performance is being diagnosed. Prefer structural fixes first, React Compiler when configured, and profiling only for targeted optimization.
---

# React Performance

Write React code so that good rendering behavior follows naturally from the architecture.

This skill is primarily **preventive**. Profiling is a second mode used when a real rendering or interaction problem exists.

## Core principles

1. Keep state as local as its ownership permits.
2. Keep components pure and rendering free of side effects.
3. Derive values during render instead of synchronizing redundant state.
4. Use composition and component boundaries to contain updates.
5. Avoid broad subscriptions to frequently changing state.
6. Keep expensive work out of hot render paths when it is unnecessary.
7. Prefer React/framework/compiler capabilities before manual memoization.
8. Optimize user-visible work, not render counts in isolation.
9. Do not sacrifice readability for speculative micro-optimizations.

## Select a mode

### Build mode — default

Use while creating or changing React code that introduces:

- local/shared/global state;
- component composition or page structure;
- Context/providers;
- forms or high-frequency input state;
- lists or large collections;
- derived data/selectors;
- expensive calculations;
- async UI updates;
- client/server component boundaries;
- custom hooks with reactive state/effects.

Read:

- [references/architecture.md](references/architecture.md)
- [references/state-and-renders.md](references/state-and-renders.md)
- [references/effects-and-computation.md](references/effects-and-computation.md)

Read additionally when relevant:

- [references/context-and-stores.md](references/context-and-stores.md)
- [references/concurrency.md](references/concurrency.md)
- [references/compiler-and-memoization.md](references/compiler-and-memoization.md)

Do not run a profiler for ordinary implementation work.

### Diagnose mode

Use when:

- interactions visibly lag;
- React rendering/hydration is suspected to dominate CPU work;
- input typing becomes slow;
- a large list/page rerenders excessively and it matters;
- React Performance/Profiler data identifies expensive commits/components;
- the user explicitly requests React render-performance investigation.

Read:

- [references/diagnostics.md](references/diagnostics.md)
- the relevant build-mode references.

Measure first, then optimize the dominant cause.

## Build workflow

1. Inspect the React version, framework, React Compiler status, state libraries, and rendering model.
2. Identify the state introduced or changed by the feature.
3. Put each state value at the lowest owner that needs to coordinate it.
4. Separate frequently changing state from broad page/application state.
5. Build component boundaries around independent update domains.
6. Remove redundant state and unnecessary Effects.
7. Keep subscriptions/selectors as narrow as practical.
8. Keep expensive work proportional to the rendered data.
9. Use transitions/deferred values only for genuinely non-urgent expensive updates.
10. Add manual memoization only when architecture/API identity requires it or evidence justifies it.
11. Preserve correctness and clear data flow.

## Diagnose workflow

1. Reproduce in an appropriate production/performance build.
2. Verify the bottleneck is React rendering/hydration rather than network, bundle loading, layout, paint, or unrelated JavaScript.
3. Use React Performance tracks/Profiler and browser Performance tooling.
4. Identify:
   - which update triggered the work;
   - which subtree rerendered;
   - which component/render calculation was expensive;
   - whether Context/store subscriptions propagated too broadly;
   - whether an Effect created cascading updates;
   - whether a large list or expensive calculation dominates.
5. Fix the highest-level structural cause first.
6. Profile again.
7. Add targeted memoization only if meaningful work remains.
8. Stop when the user-visible problem or project target is resolved.

## Hard rules

- Do not add `memo`, `useMemo`, or `useCallback` everywhere as a preventive strategy.
- Do not lift state higher than necessary merely for convenience.
- Do not move local UI state into a global store by default.
- Do not duplicate props/state into another state variable unless true independent state is required.
- Do not use an Effect to derive state that can be calculated during render.
- Do not use Effects as general event-handling or data-transformation pipelines.
- Do not mutate props, state, or values used during rendering.
- Do not create one giant Context for unrelated or high-frequency state.
- Do not subscribe a large component to an entire store object when it needs a small slice.
- Do not optimize based only on number of rerenders; cheap rerenders are often fine.
- Do not use `useTransition`/`useDeferredValue` to hide fundamentally excessive work that can be removed.
- Do not introduce custom equality functions or memoization caches without a concrete reason.
- Do not fight React Compiler with unnecessary manual memoization when the compiler is enabled and working correctly.
- Do not claim a performance improvement without evidence in diagnose mode.

## Scope boundary

This skill focuses on **React rendering and update architecture**.

Use separate skills/guidance for:

- critical rendering path / initial resource delivery;
- code splitting / bundle loading;
- tree shaking;
- image/font/network optimization;
- general browser layout/paint performance.

Those areas interact with React performance, but should not be collapsed into one skill.

## Output expectations

During implementation, report only material decisions:

- state ownership or render-boundary decision;
- unnecessary Effect/redundant state avoided;
- targeted optimization used, if any.

During diagnosis, report:

- triggering update;
- measured bottleneck;
- structural fix;
- before/after evidence;
- remaining material issue.

Do not output a generic optimization checklist unless explicitly requested.

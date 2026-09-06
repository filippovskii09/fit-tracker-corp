---
name: tanstack-query-conventions
description: Configures and uses TanStack Query in React applications with maintainable, type-safe, performant server-state conventions. Use when setting up QueryClient, creating queries or mutations, designing query keys/options, fetching server data, invalidating or updating cache, adding pagination/infinite queries, prefetching, SSR/hydration, optimistic updates, TanStack Query tests, or reviewing/refactoring existing React Query code. Prefer queryOptions-based feature-local definitions, narrow subscriptions, targeted invalidation, explicit freshness semantics, and framework-native integration. Avoid generic query wrappers, duplicated server state, arbitrary cache timings, request waterfalls, and premature cache manipulation.
---

# TanStack Query Conventions

Use TanStack Query as the application's server/async-state synchronization layer.

Keep the architecture simple:

- server state stays in TanStack Query;
- client/UI state stays in React or the appropriate client-state store;
- API transport stays in the API layer;
- query definitions connect those layers without hiding TanStack Query behind generic abstractions.

## Core principles

1. Model query identity correctly before tuning cache behavior.
2. Co-locate query keys, query functions, and reusable options by feature.
3. Prefer `queryOptions()` / `infiniteQueryOptions()` for reusable query definitions.
4. Keep custom hooks thin and domain-specific.
5. Configure freshness from product semantics, not arbitrary numbers.
6. Prefer targeted invalidation over manually maintaining a normalized cache.
7. Use mutation responses for exact atomic cache updates when the server already returned authoritative data.
8. Preserve TanStack Query's structural sharing and tracked-property optimizations.
9. Avoid request waterfalls; fetch independent data in parallel or prefetch earlier.
10. Add optimistic updates only when latency/UX justifies their complexity.
11. Do not duplicate query data into local state, Redux, Zustand, or another cache without a real ownership requirement.
12. Prefer official TanStack APIs and ESLint rules over home-grown conventions.

## Read by task

### Initial setup / architecture

Read:

- [references/setup-and-architecture.md](references/setup-and-architecture.md)
- [references/query-options-and-keys.md](references/query-options-and-keys.md)
- [references/testing-and-eslint.md](references/testing-and-eslint.md)

### Queries / data fetching

Read:

- [references/query-options-and-keys.md](references/query-options-and-keys.md)
- [references/cache-and-fetching.md](references/cache-and-fetching.md)
- [references/performance.md](references/performance.md)

### Mutations / cache synchronization

Read:

- [references/mutations-and-invalidation.md](references/mutations-and-invalidation.md)
- [references/query-options-and-keys.md](references/query-options-and-keys.md)

### Pagination / infinite / prefetch / SSR

Read:

- [references/advanced-loading.md](references/advanced-loading.md)
- [references/cache-and-fetching.md](references/cache-and-fetching.md)

### Performance investigation

Read:

- [references/performance.md](references/performance.md)
- relevant references for the affected query/mutation.

Do not load every reference for a small change.

## Default implementation workflow

1. Inspect the installed TanStack Query version, framework/router, API client, and existing conventions.
2. Identify whether the data is server state or client/UI state.
3. Reuse an existing feature query definition if one represents the same resource.
4. Otherwise create a feature-local `queryOptions()` definition with:
   - correct query key;
   - query function;
   - only justified query-specific options.
5. Use it directly in `useQuery`, prefetching, cache access, or SSR hydration as needed.
6. Add a custom hook only when it gives domain semantics, reusable selection, orchestration, or a stable public feature API.
7. For writes, use `useMutation`; decide whether the result requires:
   - no cache action;
   - targeted invalidation;
   - exact immutable cache update;
   - optimistic update.
8. Validate loading, background fetching, error, empty, and mutation states that are relevant to the UX.
9. Keep performance tuning structural and evidence-based.

## Preferred feature shape

Adapt to the repository's architecture; do not force this exact folder structure.

```text
features/todos/
  api/
    todos.api.ts
    todos.queries.ts
    todos.mutations.ts
  hooks/            # only if domain hooks add value
  components/
```

A good reusable query definition owns query identity and fetching together:

```ts
export const todoQueries = {
  all: () => ['todos'] as const,

  lists: () => [...todoQueries.all(), 'list'] as const,

  list: (filters: TodoFilters) =>
    queryOptions({
      queryKey: [...todoQueries.lists(), filters],
      queryFn: ({ signal }) => todosApi.list(filters, { signal }),
      staleTime: 30_000,
    }),

  details: () => [...todoQueries.all(), 'detail'] as const,

  detail: (id: TodoId) =>
    queryOptions({
      queryKey: [...todoQueries.details(), id],
      queryFn: ({ signal }) => todosApi.get(id, { signal }),
    }),
};
```

Treat the concrete `staleTime` above as an example only. Choose freshness from the resource's semantics.

## Custom hook policy

Custom hooks are optional.

Create one when it:

- expresses domain semantics such as `useCurrentUser`;
- combines query options with a reusable `select`;
- coordinates multiple domain queries;
- hides feature-specific conditional execution;
- provides a stable feature-level public API.

Do not create:

- `useApiQuery`;
- `useGenericQuery`;
- a wrapper that simply renames every `useQuery` option;
- a wrapper whose purpose is to avoid importing TanStack Query;
- one custom hook per endpoint when `queryOptions()` already provides reuse.

Prefer transparent TanStack Query APIs over abstraction for abstraction's sake.

## Hard rules

- Query keys must uniquely represent cached data.
- Every variable used by a query function that changes the returned data belongs in the query key.
- Do not use the same key for `useQuery` and `useInfiniteQuery`.
- Query functions must return data or throw/reject; never silently resolve `undefined`.
- Pass TanStack Query's `AbortSignal` to cancellable network requests when supported.
- Do not copy query data into component state merely to render/edit/read it.
- Do not use `enabled: false` as the default imperative fetching pattern.
- Do not globally disable focus/reconnect refetching merely because background requests were surprising.
- Do not set large `staleTime` values just to suppress requests without understanding freshness requirements.
- Do not change `gcTime` to control freshness; it controls inactive cache retention.
- Do not globally set `gcTime: Infinity` without a persistence/offline/SSR reason.
- Do not call `invalidateQueries()` without filters in normal feature code.
- Do not invalidate broad feature roots when a narrower affected key is known unless multiple representations are truly stale.
- Do not mutate cached objects in `setQueryData`.
- Do not add optimistic cache logic when normal invalidation/refetch is fast enough.
- Do not destructure query results with object rest when tracked-property optimization matters.
- Do not place the entire query/mutation result object in React hook dependency arrays.
- Do not disable structural sharing by default.
- Do not use `notifyOnChangeProps` as routine optimization; tracked properties already handle subscriptions.
- Do not create dependent queries when requests can be executed in parallel.
- Do not prefetch data with low likelihood of use by default.
- Do not share one server-side `QueryClient` across users/requests.
- Do not test against a shared QueryClient cache between tests.

## Scope boundary

TanStack Query is primarily async/server-state management.

Do not use this skill to justify storing:

- modal state;
- local form input;
- transient selection;
- theme/UI state;
- purely client-side workflow state;

in the query cache.

Likewise, do not mirror TanStack Query data into Redux/Zustand merely because those libraries already exist.

## Output expectations

During normal implementation, report only material decisions:

- query definition/key convention introduced or reused;
- freshness/invalidation behavior when non-obvious;
- cache update/optimistic strategy if used;
- relevant validation.

During review/refactoring, report concrete problems only:

- incorrect identity;
- duplicated server state;
- broad invalidation/subscription;
- unnecessary waterfall;
- incorrect freshness/cache semantics;
- abstraction or cache-update complexity with no payoff.

Do not emit a generic TanStack Query tutorial unless explicitly requested.

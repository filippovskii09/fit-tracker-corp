# Pagination, infinite queries, prefetching, SSR, and Suspense

## Pagination

Include page/cursor/filter identity in the query key.

For paginated `useQuery`, use `placeholderData: keepPreviousData` when retaining the previous page during the next-page request gives better UX.

Use `isPlaceholderData` when navigation controls need to know whether current data is previous placeholder data.

Do not manually copy previous page data into component state.

## Infinite queries

Use `useInfiniteQuery` only for additive/cursor-style experiences.

Required concepts:

- `initialPageParam`;
- `getNextPageParam`;
- optionally `getPreviousPageParam`;
- `pageParam` from QueryFunctionContext.

Do not use the same key as a normal query.

Keep property ordering compatible with current TanStack TypeScript inference or enable the official ESLint rule.

Use bounded page retention where product behavior permits.

## Parallel queries

For a known fixed set, multiple `useQuery` calls can execute in parallel in non-Suspense usage.

For a dynamic number, use `useQueries`.

Do not create serial component nesting for independent requests.

## Dependent queries

Use `enabled`/`skipToken` when query B truly requires a value produced by query A.

Recognize that this introduces a request waterfall.

If possible, redesign:

- API response;
- route loader;
- backend endpoint;
- request parameters;

to allow parallel fetching.

## Prefetching

Prefer prefetching near routing/navigation intent.

Reusable `queryOptions()` definitions should allow:

```ts
queryClient.prefetchQuery(todoQueries.detail(id));
```

without redefining query keys/functions.

Choose prefetch `staleTime` intentionally when needed.

Do not duplicate already-cached fresh data with unnecessary prefetch calls.

## SSR / hydration

Follow the installed framework's current TanStack Query integration.

Core rules:

- isolate QueryClient/cache per server request/user;
- prefetch server data;
- dehydrate the appropriate cache;
- hydrate on the client with matching query identity;
- choose SSR `staleTime` intentionally to avoid immediate unnecessary client refetch when server-fetched data is fresh.

Never instantiate a globally shared server QueryClient containing user-specific data.

## Server Components

When the framework supports Server Components, use current official guidance for prefetch/dehydrate boundaries.

Do not assume client-query patterns are the best place to fetch every piece of server-renderable data.

Use TanStack Query where client cache ownership/refetching/interactivity benefits from it.

## Suspense

Use dedicated suspense hooks such as `useSuspenseQuery` when the application architecture intentionally uses Suspense and Error Boundaries for data loading.

Do not migrate ordinary queries to Suspense merely to remove loading checks.

Understand that Suspense query execution can serialize requests in some component patterns. Prefetch or restructure when waterfalls matter.

## Initial/placeholder data

Do not confuse:

- SSR hydration;
- `initialData`;
- `placeholderData`.

Hydration transfers real prefetched cache state.
`initialData` seeds real cache data.
`placeholderData` is observer-only temporary data.

Choose the mechanism that matches data ownership.

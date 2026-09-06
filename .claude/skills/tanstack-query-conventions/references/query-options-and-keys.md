# Query options, keys, and type safety

## 1. Prefer `queryOptions()`

When options need reuse, define them once with `queryOptions()`.

Benefits:

- query key and query function stay together;
- type inference is preserved;
- the same definition works with `useQuery`;
- `prefetchQuery`, `ensureQueryData`, and cache APIs can reuse the same identity;
- reduces key/fetcher drift.

Use `infiniteQueryOptions()` for infinite queries.

## 2. Feature-local factories

Prefer feature/domain-local query option factories over one giant app-wide query-key file.

Good shape:

```ts
export const userQueries = {
  all: () => ['users'] as const,

  lists: () => [...userQueries.all(), 'list'] as const,

  list: (filters: UserFilters) =>
    queryOptions({
      queryKey: [...userQueries.lists(), filters],
      queryFn: ({ signal }) => usersApi.list(filters, { signal }),
    }),

  details: () => [...userQueries.all(), 'detail'] as const,

  detail: (id: UserId) =>
    queryOptions({
      queryKey: [...userQueries.details(), id],
      queryFn: ({ signal }) => usersApi.get(id, { signal }),
    }),
};
```

This gives intentional prefixes for invalidation without maintaining an unrelated global registry.

## 3. Query-key dependencies

A query key is a dependency list for its query function.

If the returned data changes when a serializable variable changes, include that variable in the key.

Examples:

- `id`;
- pagination cursor/page;
- filter;
- search text;
- sorting;
- tenant/org scope;
- locale if it changes response data;
- permission/user scope if it changes cache identity.

Do not include:

- stable API function references;
- UI callbacks;
- non-data concerns.

## 4. Keys must be serializable and deterministic

Top-level query keys are arrays.

Prefer plain serializable primitives/objects that represent data identity.

Avoid:

- class instances;
- functions;
- DOM objects;
- unstable generated values;
- values unrelated to server response identity.

## 5. Normal vs infinite queries

Never reuse the same query key for:

- `useQuery`;
- `useInfiniteQuery`.

Their cached data shapes differ.

Use distinct hierarchy, e.g.:

```ts
['todos', 'list', filters][('todos', 'infinite', filters)];
```

## 6. TypeScript

Let inference do most work.

Prefer typed API functions plus `queryOptions()` rather than manually passing every generic to `useQuery`.

Use TanStack Query's global `Register` augmentation only when the application benefits from a consistent:

- error type;
- query/mutation key hierarchy;
- query/mutation `meta`.

Do not introduce global key/meta typing solely because the feature exists.

## 7. Query Function Context

Query functions receive context including:

- `queryKey`;
- `signal`;
- `meta`;
- `pageParam` for infinite queries.

Prefer consuming the supplied `signal`.

For complex factories, QueryFunctionContext can also avoid accidental drift between keys and query dependencies, but do not make simple functions harder to read just to use context.

## 8. `select`

Use `select` when a consumer needs a derived subset/shape and narrower subscription is useful.

Good uses:

- select one entity from a larger result;
- map DTO result to a view-focused subset;
- calculate a reusable derived value.

Remember:

- selected data is observer output, not a replacement of cached data;
- expensive selectors should have stable identity or be defined outside render / memoized where appropriate.

Do not use `select` for transformations every consumer needs if transformation belongs naturally at the API/query-function boundary.

## 9. Do not over-abstract

Prefer:

```ts
useQuery(userQueries.detail(id));
```

over:

```ts
useApiQuery({
  resource: 'users',
  action: 'detail',
  params: { id },
  cachePolicy: ...
})
```

unless the project genuinely has a domain-specific platform abstraction whose value exceeds the loss of TanStack Query semantics.

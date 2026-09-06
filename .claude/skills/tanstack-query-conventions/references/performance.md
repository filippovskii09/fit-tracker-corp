# TanStack Query performance

Most TanStack Query performance comes from correct data flow, not manual memoization.

## 1. Preserve structural sharing

Structural sharing keeps references stable for unchanged JSON-compatible data.

Leave it enabled by default.

Do not disable it because "new API responses are new objects".

Only customize/disable when:

- data contains unsupported non-JSON structures and reference behavior matters;
- profiling proves structural-sharing work itself is a problem;
- a domain-specific comparer is justified.

## 2. Tracked properties

TanStack Query tracks which result properties a component reads and rerenders when those properties change.

Prefer explicit destructuring:

```ts
const { data, isPending, error } = useQuery(...)
```

Avoid object-rest patterns such as:

```ts
const { data, ...queryInfo } = useQuery(...)
```

because they can access/subscribe to all properties and defeat tracked-property optimization.

Do not set `notifyOnChangeProps` manually for ordinary queries.

## 3. Result object stability

The top-level object returned from query/mutation hooks is not referentially stable.

Do not do:

```ts
const query = useQuery(...)
useEffect(() => {}, [query])
```

Destructure the specific stable/needed values instead.

## 4. `select`

Use `select` for fine-grained subscriptions when a component needs only part of query data.

Example:

```ts
const count = useQuery({
  ...todoQueries.list(filters),
  select: (todos) => todos.length,
});
```

A consumer selecting a stable derived result can avoid rerenders caused by unrelated data changes.

Do not scatter tiny selectors everywhere unless there is architectural or measured value.

## 5. Avoid duplicate server state

Copying query data into:

- `useState`;
- Redux;
- Zustand;
- Context;

creates extra updates, memory, synchronization code, and stale-data risk.

Use cache data directly unless the new state has independent ownership, e.g. an editable form draft intentionally detached from server updates.

## 6. Request waterfalls

Independent requests should start in parallel.

Avoid:

```text
query A
  ↓ wait
render child
  ↓
query B
```

when B does not actually depend on A.

Options:

- move independent queries to the same render level;
- `useQueries` for dynamic parallel sets;
- route-level prefetch;
- server loader/prefetch;
- backend aggregation when serial dependency is unavoidable and latency matters.

Dependent queries inherently create waterfalls. Use them only for real dependencies.

## 7. Prefetch likely work

Prefetch can remove loading waterfalls when future data needs are predictable.

Good triggers:

- route loader knows what the route will need;
- user navigates/expresses intent to open a detail view;
- pagination can predict the next page;
- server rendering knows required queries.

Do not prefetch the entire application.

A prefetch that competes with more important current work can reduce performance.

## 8. Cache cardinality

Query keys containing highly variable inputs can create many cache entries.

Examples:

- search text per keystroke;
- arbitrary filter combinations;
- rapidly changing coordinates.

Mitigate based on UX:

- debounce input before it becomes query identity where appropriate;
- use reasonable `gcTime`;
- avoid querying until input is meaningful;
- design backend/search APIs appropriately.

Do not reuse one key for different search inputs to avoid cache growth; that breaks correctness.

## 9. Stable freshness reduces needless work

Appropriate `staleTime` can avoid unnecessary refetches for data that is known to stay valid.

Do not globally turn every resource "fresh forever" to reduce request counts.

## 10. Infinite queries

Do not store unbounded pages forever without thinking about memory/network costs.

When supported by the installed version and product behavior, use `maxPages` when only a bounded window is needed.

Avoid refetching or rendering a huge history if the user only needs a working window.

## 11. Performance diagnosis

Use:

- TanStack Query Devtools;
- browser Network;
- React Profiler when rerenders matter;
- request waterfall inspection.

Classify first:

- unnecessary request;
- waterfall;
- excess rerender;
- cache cardinality/memory;
- expensive `select`;
- over-broad invalidation;
- query-key bug.

Fix the structural cause before adding custom cache tricks.

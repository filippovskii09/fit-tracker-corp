# Mutations and cache synchronization

## 1. Use mutations for writes

Use `useMutation` for server-side state changes.

Keep mutation functions in the API/domain layer and cache synchronization in the mutation/query layer.

Do not implement writes as disabled queries.

## 2. Choose the simplest synchronization strategy

After a successful mutation, choose in this order:

### A. Nothing

If no visible cached representation is affected, do nothing.

### B. Targeted invalidation

Default when the mutation makes one or more cached representations stale and refetching is cheap/reliable.

```ts
await queryClient.invalidateQueries({
  queryKey: todoQueries.lists(),
});
```

Prefer the narrowest prefix that represents all stale views.

### C. Exact cache update

Use when the mutation response returns authoritative updated data and the cache entry is easy to identify.

```ts
queryClient.setQueryData(todoQueries.detail(id).queryKey, updatedTodo);
```

This can avoid an unnecessary network round trip.

Update immutably.

### D. Optimistic update

Use only when latency-sensitive UX benefits enough to justify:

- cancellation;
- snapshot/rollback;
- concurrency handling;
- error recovery;
- reconciliation with server result.

Optimistic updates are not the default write strategy.

## 3. Invalidate by semantics

Invalidate every representation that became stale, not every query in the app.

Examples:

- updating a todo detail may stale both detail and lists;
- deleting an entity may stale list/count/search queries;
- toggling a property might be safely updated atomically if the response is authoritative.

Do not invalidate all queries after every mutation.

## 4. Mutation responses

When server returns the updated entity, consider writing that exact response into the matching detail cache.

Do not reconstruct authoritative server fields on the client when the server already returned them.

Lists may still need invalidation if sorting/filtering/membership could change.

## 5. Immutability

Never mutate cached data in place.

Incorrect:

```ts
old.title = input.title;
return old;
```

Correct:

```ts
return old ? { ...old, title: input.title } : old;
```

For nested collections, update only changed branches and preserve unchanged references.

## 6. Optimistic UI vs optimistic cache

TanStack Query supports:

- rendering mutation variables optimistically in UI;
- directly updating the cache in `onMutate`.

Prefer UI-level optimism when only one place needs the temporary state and cache surgery adds no value.

Use cache-level optimism when multiple consumers must see the optimistic state.

## 7. Mutation callbacks

Use mutation lifecycle callbacks for cache synchronization and mutation-specific side effects.

Keep unrelated UI orchestration near the calling component when it depends on that invocation.

Be aware that component-level mutate callbacks can have different lifecycle behavior when components unmount/consecutive mutations occur. Keep cache correctness in the stable mutation definition/defaults where appropriate.

## 8. `mutate` vs `mutateAsync`

Prefer `mutate` for callback-driven flows.

Use `mutateAsync` when promise composition is actually needed:

```ts
await mutation.mutateAsync(input);
```

Do not convert every mutation to async/await by default.

## 9. Retry writes carefully

Mutations do not retry by default.

Do not enable automatic retries for non-idempotent operations unless the API/idempotency design makes duplicate execution safe.

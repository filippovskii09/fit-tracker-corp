# Fetching and cache semantics

## 1. Query functions must fail correctly

A query function must:

- resolve with data; or
- reject/throw an error.

Do not return `undefined` as successful query data.

If using `fetch`, remember that HTTP 4xx/5xx do not automatically reject. The API layer must check the response and throw an appropriate error.

## 2. Cancellation

TanStack Query supplies an `AbortSignal`.

Pass it to supported request clients:

```ts
queryFn: ({ signal }) => api.getUser(id, { signal });
```

This lets obsolete/cancelled query work terminate when the transport supports it.

Do not create a separate custom cancellation system when AbortSignal already solves the case.

## 3. Retry policy

Queries retry on the client by default.

Customize retries based on error semantics, not annoyance.

Normally do not retry:

- validation/4xx errors that cannot succeed unchanged;
- authorization/permission failures;
- deterministic domain errors.

Retries can make sense for:

- transient network failures;
- selected 5xx;
- temporary infrastructure failures.

Mutations do not retry by default. Be especially cautious retrying non-idempotent writes.

## 4. Background refetching

Distinguish:

- `isPending`: no successful cached data yet;
- `isFetching`: query function is currently running, including background refetch;
- refetch error vs initial loading error.

Do not replace useful cached UI with a full-page spinner just because a background refetch is running.

## 5. Focus/reconnect behavior

Stale active data can refetch on focus/reconnect.

Treat this as synchronization behavior, not accidental network noise.

If a resource should not refetch often, first set appropriate freshness.
Only disable focus/reconnect behavior when product semantics require it.

## 6. Disabled/lazy queries

Prefer declarative dependencies.

Use `enabled` or TypeScript `skipToken` when a query genuinely cannot execute until a dependency exists.

Example:

- detail query requires an ID obtained elsewhere.

Avoid permanently `enabled: false` plus `refetch()` as a replacement for ordinary declarative querying. It opts out of automatic behavior such as invalidation-triggered refetch.

Use explicit imperative fetch APIs when the use case is genuinely imperative.

## 7. Initial vs placeholder data

`initialData`:

- seeds the cache;
- is treated as real cached data;
- should be complete/authoritative enough for that query.

`placeholderData`:

- affects the observer;
- is not persisted to the query cache;
- is appropriate for previews/temporary previous data.

Do not put partial fake detail data in `initialData`.

## 8. Persistence

Persistent query caches are optional architecture, not baseline setup.

Use persistence when the product actually needs:

- offline support;
- fast reload from durable cache;
- persisted mutations.

When persisting:

- align `gcTime` / max-age semantics;
- avoid storing sensitive data without a security review;
- handle cache/schema/version changes;
- do not persist everything by default.

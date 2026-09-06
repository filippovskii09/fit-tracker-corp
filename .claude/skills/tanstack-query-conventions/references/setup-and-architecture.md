# Setup and architecture

## 1. QueryClient

Create a stable `QueryClient`.

For a pure client-rendered SPA, a module-level singleton is normally appropriate.

For SSR/server rendering, follow the framework adapter's current recommendation and ensure caches are request/user isolated. Never create a shared server cache that can leak data between requests.

Do not instantiate a new `QueryClient` during every React render.

## 2. Defaults

TanStack Query defaults are intentionally active:

- cached query data is stale by default;
- stale queries may refetch on mount, window focus, or reconnect;
- client queries retry failures by default;
- inactive queries are garbage-collected after the default `gcTime`;
- structural sharing is enabled.

Do not immediately override all defaults.

Set global defaults only when they represent a project-wide policy.

Examples that can be project-wide:

- error/retry policy based on API error classes;
- a conservative baseline `staleTime` if most resources share similar freshness;
- mutation/query `meta` conventions;
- network mode for an offline-first product.

Prefer query-specific options for resources with different freshness or retry behavior.

## 3. Freshness is domain semantics

Use `staleTime` to answer:

> For how long can this cached snapshot be considered fresh enough that automatic refetch is unnecessary?

Examples:

- live operational data: short freshness;
- user profile/config that rarely changes: longer freshness;
- immutable/versioned content: very long or static semantics when appropriate.

Do not choose `staleTime` from a universal best-practice number.

## 4. `gcTime` is not freshness

`gcTime` answers:

> How long should inactive cached data remain in memory before garbage collection?

It does not mean:

- refetch after this time;
- consider data stale after this time.

Keep the default unless memory usage, navigation behavior, persistence, or product semantics justify another value.

## 5. API layer boundary

The API layer should own transport details:

- URL/method;
- request/response validation or DTO mapping when used;
- auth headers/interceptors;
- HTTP error normalization;
- AbortSignal plumbing.

The query layer should own:

- query identity;
- query options;
- cache freshness;
- server-state synchronization.

Do not put JSX/UI concerns in API functions.
Do not make the API layer import React Query.

## 6. Server state vs client state

TanStack Query owns snapshots of remote authoritative state.

React/local store owns UI state.

A common architecture:

```text
API transport
     ↓
queryOptions / mutation definitions
     ↓
TanStack Query cache
     ↓
React components / domain hooks
```

Avoid:

```text
TanStack Query
     ↓
useEffect
     ↓
setState / Redux copy
     ↓
React
```

The second graph introduces two sources of truth and synchronization bugs.

## 7. Devtools

Use TanStack Query Devtools in development when useful.

Do not ship development-only debugging UI to production unless intentionally configured.

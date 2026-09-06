# Context and state-store performance

## Context

Context is a propagation mechanism, not a universal state-management solution.

Use it when a value genuinely has broad tree ownership.

Performance-aware defaults:

- avoid high-frequency unrelated values in one provider object;
- place providers as low as ownership permits;
- separate contexts when domains or change frequencies differ materially;
- avoid recreating provider objects/functions solely due to avoidable architecture.

If React Compiler is not enabled, stable provider values may sometimes require `useMemo`/`useCallback`, but do not add them mechanically. Fix provider scope first.

## Redux / Redux Toolkit

Use Redux where state is genuinely shared/global or benefits from its architecture.

Prefer:

- normalized relational state where appropriate;
- `createEntityAdapter` for entity collections;
- small component subscriptions;
- selectors for encapsulating lookups/derived data;
- `createSelector` for expensive derived computations or stable aggregate selector outputs.

Avoid:

- selecting the entire root/slice when only one field/entity is needed;
- returning fresh arrays/objects from selectors on every update without reason;
- moving ephemeral component UI state into Redux merely because Redux exists.

Connecting more leaf components to specific data can be more performant than one large parent subscription passing everything downward.

## Server-state libraries

For TanStack Query, RTK Query, or similar:

- let the cache remain the source of truth for server state;
- avoid copying query results into local/global state without a real transformation/ownership requirement;
- subscribe to the narrow query/data representation the UI needs when the library supports it;
- avoid refetch/update policies that cause unnecessary broad UI work.

Use the dedicated library skill when available for library-specific optimization rules.

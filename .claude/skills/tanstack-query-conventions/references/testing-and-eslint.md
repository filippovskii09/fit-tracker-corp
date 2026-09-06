# Testing and ESLint

## 1. Install the official ESLint plugin

When the project uses ESLint and TanStack Query materially, prefer:

```bash
pnpm add -D @tanstack/eslint-plugin-query
```

Use the plugin's current recommended flat configuration when compatible with the repository.

The official plugin can enforce rules for:

- exhaustive query-key dependencies;
- stable QueryClient;
- avoiding rest destructuring;
- avoiding unstable query results in hook dependencies;
- infinite-query property order;
- non-void query functions;
- mutation property order;
- preferring query options.

Do not duplicate these rules manually with custom lint logic.

## 2. Tests get isolated QueryClients

Each test or test wrapper should get a fresh `QueryClient`.

Do not reuse cached state between unrelated tests.

Create a small testing utility:

```ts
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
```

Adapt options to the installed version and suite.

## 3. Disable retries in error tests

Normal query retry behavior can make tests slow/flaky.

Testing defaults should usually disable retries unless retry behavior itself is under test.

## 4. Test user-visible behavior

For React components, prefer:

- MSW or the project's network boundary;
- React Testing Library;
- real QueryClientProvider.

Test:

- loading when meaningful;
- successful data rendering;
- error UI;
- mutation success/error;
- cache-refetch behavior only where it is part of user-visible semantics.

Do not mock `useQuery` in ordinary integration/component tests merely to make tests easier.

Mocking the hook bypasses the exact behavior this library manages.

## 5. Test query functions/API layer separately when useful

Transport parsing, runtime validation, DTO mapping, and error normalization can be unit/integration tested at the API boundary.

Do not test TanStack Query internals.

## 6. Cache update tests

When custom optimistic or `setQueryData` logic is non-trivial, test:

- successful update;
- rollback/error;
- authoritative server reconciliation;
- affected query keys.

Simple invalidation usually does not need elaborate unit tests.

## 7. Time-dependent options

Avoid real long waits for:

- stale times;
- retries;
- refetch intervals.

Use fake timers only where compatible and actually necessary; prefer configuring the test client to remove unrelated timing behavior.

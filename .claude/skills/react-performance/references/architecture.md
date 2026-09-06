# Performance-aware React architecture

## 1. Optimize ownership before memoization

The strongest default optimization is to prevent an update from reaching unrelated work.

Ask for every state value:

- who owns it?
- who reads it?
- who changes it?
- which components actually need to rerender when it changes?

Keep state at the lowest common owner that needs to coordinate it.

Do not place state in:

- the app root;
- a page root;
- Context;
- Redux/Zustand/another global store;

unless its real ownership requires that scope.

State colocation usually improves both maintainability and update isolation.

## 2. Design independent update domains

If one interaction changes one small part of the UI, structure components so unrelated expensive siblings do not need that state.

Prefer:

Page

- StableExpensiveContent
- SearchPanelWithLocalState
- Sidebar

over putting `searchQuery` in `Page` when only `SearchPanel` needs it.

This is not about creating components solely for performance. Use component boundaries that also represent meaningful ownership or UI responsibilities.

## 3. Composition before optimization wrappers

Composition can isolate state naturally.

If a wrapper owns state but large children do not depend on that state, pass stable children/content through composition rather than forcing the wrapper to own and recreate the whole subtree conceptually.

Prefer structural boundaries over blanket `memo`.

## 4. Keep high-frequency state narrow

Examples:

- controlled input text;
- hover/drag position;
- animation-related UI state;
- resize/pointer interactions;
- transient form-field state.

Do not put high-frequency state at a broad page/application level without a reason.

For forms, prefer field/form-local ownership or a form library architecture that provides narrow subscriptions rather than rerendering the entire application for each keystroke.

## 5. Separate state categories

Distinguish:

- local UI state;
- shared client state;
- server/cache state;
- URL/navigation state;
- external store state.

Do not mirror server/cache data into React local state merely to "have it locally".
Do not move URL state into global state if the URL is the source of truth.

Each additional synchronized source increases work and inconsistency risk.

## 6. Server/client boundaries

In frameworks that support Server Components or equivalent server/client separation:

- keep non-interactive rendering server-side when appropriate;
- keep client boundaries as narrow as practical;
- avoid making high-level layouts client components just because one descendant needs interactivity.

Reducing the client reactive tree can remove work more effectively than memoizing it.

Do not force server/client architecture into plain CSR projects.

## 7. Custom hooks

Custom hooks reuse stateful logic, not execution.

Their code executes as part of each consuming component render.

Keep custom hooks:

- pure during render;
- free of unnecessary calculations;
- free of redundant derived state;
- narrowly subscribed to external stores where possible.

Do not assume moving expensive code into a custom hook makes it cheaper.

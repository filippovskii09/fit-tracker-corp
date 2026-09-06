---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Public API and Import Boundaries

Treat architectural modules/slices as public API boundaries.

- Expose intended public members through a local `index.ts`.
- External consumers must import through that public API, not internal file paths.
- Prefer:
  `@/api`
  `@/features/auth`
  `@/pages/planner`
- Avoid deep imports such as:
  `@/api/http`
  `@/features/auth/api/googleAuth`
  `@/pages/planner/PlannerPage`
- Do not create broad root barrels that combine unrelated modules, such as
  `@/features` or `@/pages`.
- Inside the same module/slice, prefer the nearest submodule public API when one exists.
  Prefer:
  `../api`
  `../model`
  `../hooks`
  over:
  `../api/googleAuth`
  `../model/AuthContext`
  `../hooks/useGoogleSignIn`
- Use direct file imports only when the target does not represent a meaningful
  submodule/public boundary or when importing through an index would create a cycle.
- Export only the stable API consumers need.
- Prefer explicit named re-exports:
  `export { request } from './http'`
  over `export *`.
- Do not expose internals merely for convenience.
- If a barrel creates circular dependencies, bundling, tree-shaking, or
  environment-boundary problems, split the public API instead of forcing one barrel.

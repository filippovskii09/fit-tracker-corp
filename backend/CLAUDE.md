# Backend Instructions

Applies to work under `backend/`.

Stack: Node.js, NestJS, TypeScript, TypeORM, PostgreSQL, Jest, Supertest.

## Backend workflow

For backend implementation with defined requirements, use `backend-development-workflow`.

That workflow owns:

`task/spec → be-implementer → be-reviewer → fix/re-review if required → completion`

* `be-implementer` owns backend source changes and task-relevant tests.
* `be-reviewer` owns independent merge-quality review and final `APPROVE` / `CHANGES_REQUIRED`.
* Do not invoke both agents manually when the workflow already owns the task.

Exploration, debugging, explanation, or planning without implementation does not require the development workflow.

If one acceptance criterion requires coordinated frontend and backend changes, return orchestration to the root/full-stack scope instead of silently changing frontend from a backend-only task.

## Backend architecture baseline

Preserve the current architecture unless an approved task/design changes it:

* feature-oriented Nest modules;
* controller → service/provider → TypeORM persistence;
* controllers stay transport-focused;
* services contain application/business logic and direct TypeORM repository access;
* do not introduce repository/domain/CQRS layers without a concrete need;
* `@src/*` is used for cross-domain/shared imports; local feature imports remain relative;
* schema evolution uses migrations; `synchronize` remains disabled.

Existing code is evidence of conventions, not permission to copy a known defect.

## Always-on backend rules

Path-scoped rules under `.claude/rules/` define mandatory backend invariants:

* `backend-boundaries.md` — Nest/module/import boundaries;
* `database-changes.md` — schema, migrations, relations, transactions, indexes;
* `backend-authz.md` — protected routes, ownership, sensitive data.

Keep those rules short. Do not duplicate their detailed reasoning here.

## Engineering skills

Use skills by touched surface; do not load every reference for every task:

* `nestjs-engineering` — Nest modules, providers, DI, request lifecycle, DTO validation, HTTP errors;
* `typeorm-postgres` — entities, relations, migrations, constraints, transactions, cascades, indexes, query shape;
* `backend-security` — authentication, authorization/ownership, JWT/refresh/cookies, CSRF, secrets, CORS/throttling;
* `backend-testing` — unit/integration/PostgreSQL/e2e/migration/security test selection;
* `typescript-engineering` — non-trivial TypeScript modeling and API typing.

The backend implementer/reviewer preload these skills. Follow each skill's reference-routing rules instead of opening all references eagerly.

## Verification

Run the smallest relevant checks first, then broader checks required by the task.

From `backend/`:

* targeted Jest tests when possible;
* `npm run test --prefix backend -- --runInBand` (from the repository root) for the backend unit suite when justified;
* `npm run test:cov` when coverage verification is relevant;
* `npx eslint "{src,apps,libs,test}/**/*.ts"` for a non-mutating lint check;
* `npm run build`;
* `npm run test:e2e` only when the e2e setup required by the task exists and is intended to run.

Persistence behavior that depends on PostgreSQL must be verified against PostgreSQL, not an in-memory substitute.

Never run destructive migration/reset/revert operations against a database unless it is explicitly known to be disposable.

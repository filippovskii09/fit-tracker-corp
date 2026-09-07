---
name: backend-testing
description: Apply project-specific backend testing rules when adding or reviewing Jest unit tests, Nest integration tests, real-PostgreSQL tests, HTTP e2e/Supertest tests, migration verification, or auth/authz/validation coverage. Use when backend behavior changes or when selecting the minimum test level that can actually prove correctness. Do not use as primary guidance for Nest architecture, persistence design, or security policy; defer those to dedicated skills.
---

# Backend Testing

Choose the lowest test level that can prove the behavior without mocking away the thing being verified.

Preserve the project's existing Jest + `@nestjs/testing` + Supertest stack.

## Before writing tests

1. Read the changed production path first.
2. Identify the behavior/invariant being proved.
3. Identify which framework/database/security boundary must remain real for that behavior.
4. Reuse the smallest existing test setup that exercises that boundary.
5. Load only the reference files relevant to the change.

## Core rules

- Test behavior and invariants, not implementation trivia.
- Do not add tests merely to increase coverage percentage.
- Mock collaborators only when the test is intentionally isolated from them.
- Never mock away the boundary the test is supposed to verify.
- Direct controller method calls do not prove routing, guards, pipes, decorators, cookies, or HTTP serialization.
- Mocked repositories do not prove PostgreSQL constraints, relations, cascades, transactions, query behavior, or migrations.
- Use real PostgreSQL for persistence behavior that depends on PostgreSQL/TypeORM semantics.
- Do not substitute SQLite/in-memory DB for PostgreSQL-specific behavior.
- Use HTTP e2e/Supertest when correctness depends on the Nest application boundary.
- Bootstrap e2e tests with the same relevant global pipes/filters/interceptors/prefix/configuration as production.
- Schema changes require migration verification against a fresh database.
- Auth/authz/validation changes require negative-path tests, not only happy paths.
- For user-owned resources, test cross-user denial explicitly.
- For multi-write atomic operations, test rollback on an intermediate failure.
- Keep tests deterministic and isolated. One test must not depend on execution order or leftover data.
- Prefer a focused test at the correct level over duplicating the same assertion at every layer.
- Do not change production behavior merely to satisfy an incorrect or implementation-coupled test.

## Test level selection

- **Unit** — pure/provider logic where collaborators can be represented safely by test doubles.
- **Nest integration** — DI/module/provider wiring or several real Nest providers working together.
- **PostgreSQL integration** — real persistence semantics, constraints, transactions, relations, query behavior.
- **HTTP e2e** — routing + guards + pipes + cookies + serialization + application wiring.
- **Migration verification** — schema transition itself.

Move upward only when the lower level cannot prove the behavior.

## Reference routing

Read only when the condition matches:

- `references/unit-mocking.md` — mocked service/controller/provider tests and what not to mock.
- `references/nest-integration.md` — real Nest DI/module/provider composition without full HTTP.
- `references/postgres-integration.md` — real PostgreSQL, constraints, relations, transactions, isolation.
- `references/http-e2e.md` — Supertest, bootstrap, guards/pipes/cookies/status/response contract.
- `references/migration-tests.md` — fresh DB migration run, revert/run checks, schema/data transition verification.
- `references/auth-authz-validation.md` — authentication, refresh flow, ownership/BOLA, authorization, validation negatives.

## Delegate instead of expanding this skill

- Nest module/controller/provider design → `nestjs-engineering`.
- Entities/relations/migrations/index/transaction design → `typeorm-postgres`.
- Auth/security policy → `backend-security`.
- General TypeScript modeling → `typescript-engineering`.

## Completion checks

- each changed invariant is covered at a level capable of proving it;
- no important boundary was mocked away;
- success and meaningful failure paths are covered;
- DB-dependent behavior ran against PostgreSQL;
- HTTP-dependent behavior ran through `app.getHttpServer()`;
- authz tests include another-user/unauthorized cases where applicable;
- validation tests exercise the real global validation pipeline where relevant;
- migration changes run successfully on a fresh database;
- tests clean up state/resources and are order-independent;
- existing test runner/framework was not replaced without an explicit task requirement;
- relevant test command(s) and build pass.

# PostgreSQL integration tests

Load when correctness depends on PostgreSQL or TypeORM persistence semantics.

## Use real PostgreSQL for

- FK / NOT NULL / UNIQUE / CHECK;
- relation persistence and `ON DELETE`;
- cascade writes;
- transaction commit/rollback;
- query-builder SQL;
- PostgreSQL-specific types/operators;
- concurrency/locking behavior;
- repository queries dependent on real data shape;
- schema produced by migrations.

Mocked repositories cannot prove these.

Do not substitute SQLite/in-memory DB for PostgreSQL-specific behavior.

## Database source

Use an isolated disposable PostgreSQL instance:

- Testcontainers PostgreSQL;
- dedicated ephemeral PostgreSQL CI service;
- another disposable test DB.

Never run automated integration tests against dev/staging/prod data.

## Schema setup

For production-like persistence verification:

- run real migrations;
- keep `synchronize: false`.

Do not let test-only auto-sync hide missing/broken migrations.

## Isolation

Tests must not depend on prior test rows or execution order.

Use an explicit cleanup strategy:

- disposable DB/container per suite;
- truncate/reset relevant tables;
- transaction rollback per test only when all tested DB work shares that transaction context.

Do not assume rollback isolation works when application code opens separate connections/transactions.

## Assert behavior

Assert:

- rows written/read;
- relation/FK behavior;
- constraint failure;
- rollback leaves no partial state;
- delete semantics;
- query result.

## Testcontainers

If chosen:

- pin an explicit PostgreSQL image version compatible with production;
- wait for readiness through the library;
- release resources;
- avoid one container per individual test unless required.

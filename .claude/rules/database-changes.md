# Database Changes

Apply to all TypeORM/PostgreSQL changes.

## Migrations

* `synchronize` must remain disabled.
* Any schema-affecting entity change requires a migration.
* Review entity metadata and migration SQL together; do not trust generated migrations blindly.
* Never edit an already-applied migration unless the task explicitly establishes that it is safe.
* Never run destructive migration/reset/revert commands against a database unless it is explicitly disposable.

## Relations

Every relation change must explicitly verify:

* owning side / join column;
* FK existence;
* nullability;
* `ON DELETE`;
* cascade behavior;
* index needs.

Do not use broad `cascade: true` by default; enable only required cascade operations.

## Indexes

* Do not assume PostgreSQL creates an index for a referencing FK column.
* Add indexes only from real query patterns (`WHERE`, `JOIN`, `ORDER BY`, uniqueness, pagination), not speculatively.

## Integrity

* Put durable invariants in database constraints where PostgreSQL can enforce them (`NOT NULL`, `UNIQUE`, `CHECK`, FK).
* Use a transaction when multiple writes must succeed or fail atomically.
* Inside a TypeORM transaction, use only the transaction-scoped `EntityManager` / repositories derived from it.

For detailed persistence decisions, use `typeorm-postgres`.

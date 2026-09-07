# Migration verification

Load when adding or changing a TypeORM migration or entity schema.

## Goal

Prove the production schema transition itself.

Entity tests are not migration tests.

## Minimum verification

For a schema change:

1. start from a fresh PostgreSQL database;
2. run the real migration chain through the configured TypeORM `DataSource`;
3. verify all migrations succeed;
4. exercise persistence/API behavior that depends on the new schema.

This catches discovery/order issues, invalid SQL, entity/migration drift, missing constraints/indexes/columns, and tests that only work with `synchronize`.

## down

For a new reversible structural migration, verify:

run → revert latest → run latest

when safe and meaningful.

Do not invent fake reversibility for destructive data transforms.

## Existing-data transitions

If the migration changes nullability, uniqueness, type, names, relations/FKs, or data format, test representative pre-migration rows.

A fresh empty schema is insufficient for a data migration/backfill.

## Production parity

- PostgreSQL only.
- `synchronize: false`.
- use the same migration discovery/config source as production, or a wrapper importing that source.

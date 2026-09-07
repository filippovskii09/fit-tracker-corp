# Schema and migrations

Load when an entity change affects the database schema.

## Project baseline

The project uses TypeORM migrations with `synchronize: false`. Preserve that model.

## Entity ↔ migration invariant

A persisted schema change is incomplete until both are correct:

> entity metadata ↔ migration SQL

Schema-affecting changes include:

- table/column creation or removal;
- rename;
- type/length/precision change;
- nullability/default change;
- enum change;
- relation/FK change;
- unique/check constraint;
- index.

Do not merge an entity-only schema change.

## Generated migrations

`migration:generate` is a starting point, not approval.

Always inspect generated SQL for:

- accidental `DROP` + `ADD` instead of rename;
- destructive type conversion;
- unexpected default changes;
- making a populated column `NOT NULL`;
- dropped/recreated constraints or indexes;
- relation columns becoming nullable;
- table rebuild/data loss behavior.

If generated SQL does not express the intended production transition, edit or create the migration manually.

## up / down

`up` must move the current production schema/data to the new state.

`down` should reverse the structural change when reasonably safe. Do not pretend a destructive data migration is reversible if the old data cannot be reconstructed.

When a change requires data backfill, order the transition deliberately:

1. add compatible schema;
2. backfill existing rows;
3. add/enforce stricter constraint;
4. remove obsolete schema only when old code/data no longer depends on it.

Do not add a non-null column to existing populated data without a valid migration path.

## Renames

For a semantic rename, prefer explicit rename SQL/API rather than generated drop-and-create behavior that loses data.

## Migration transactions

TypeORM can run migrations transactionally, but some PostgreSQL operations have special transaction requirements. Review operations such as concurrent index creation instead of assuming the default migration transaction mode always applies.

## Production discipline

Do not:

- enable `synchronize: true`;
- edit an already-applied migration to change production history;
- hide schema drift with `IF NOT EXISTS` unless idempotency is intentionally required and verified;
- mix unrelated schema changes into one migration.

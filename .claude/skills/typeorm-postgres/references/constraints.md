# PostgreSQL constraints

Load when the database must enforce a durable invariant.

## Database boundary

Use PostgreSQL constraints for invariants that must remain true regardless of which application code path performs the write.

Application/DTO validation improves errors and developer experience; it does not replace DB integrity under concurrency or alternate write paths.

## Choose the native constraint

### NOT NULL

Use when absence is not a valid persisted state.

### UNIQUE

Use for database-level uniqueness.

A service pre-check such as "find before insert" does not guarantee uniqueness under concurrency. Keep the unique constraint and translate its violation at the application boundary where needed.

For uniqueness across several columns, use a composite unique constraint/index that represents the actual invariant.

### CHECK

Use for row-local invariants PostgreSQL can evaluate reliably.

Do not use PostgreSQL `CHECK` to enforce rules that depend on other table rows.

### Foreign key

Use for referential integrity when a referenced row must exist.

Define delete behavior deliberately.

## Constraint vs index

Use a constraint when the purpose is correctness/integrity.

Use a non-unique index when the purpose is query performance.

`PRIMARY KEY` and `UNIQUE` constraints create supporting unique indexes automatically; ordinary foreign-key referencing columns do not.

## Naming

Prefer stable, understandable constraint names when they are useful for:

- migrations;
- DB-error translation;
- operational debugging.

Do not couple application logic to opaque auto-generated names if a stable error mapping is required.

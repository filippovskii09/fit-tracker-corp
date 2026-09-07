# Relations and referential integrity

Load when adding/changing entity relations or FK columns.

## Model the database relationship explicitly

For each relation answer:

- Which entity owns the relation / join column?
- Is the relationship required or optional?
- What FK constraint exists in PostgreSQL?
- What should happen when the referenced row is deleted?
- Does the referencing column need an index for actual query/join patterns?
- Is cascade persistence required?

Do not stop at adding a TypeORM decorator.

## Owning side

The owning side stores the foreign key/join information.

For `ManyToOne` / owning `OneToOne`, ensure entity metadata and migration agree on:

- join column name;
- FK target;
- nullability;
- delete action.

A raw `userId`-style column without a database FK allows orphan rows. Use raw FK columns only when the lack of a referential constraint is intentional.

## Nullability

Make required relationships `NOT NULL`; do not rely on TypeScript non-optional properties to enforce persistence.

Optional relationships may be nullable, but verify all downstream logic handles absence.

## ON DELETE

Choose from domain ownership, not convenience.

- `CASCADE`: child is a component of parent and should not outlive it.
- `RESTRICT` / `NO ACTION`: referenced and referencing rows represent independently meaningful objects.
- `SET NULL`: relation is optional after target deletion.

Do not apply `CASCADE` to catalog/shared entities merely because it simplifies cleanup.

## Foreign-key indexes

PostgreSQL automatically indexes referenced primary/unique keys, but does not automatically create an index on the referencing FK column.

Index the referencing side when real joins/filter/delete-check workloads justify it.

## Bidirectional relations

Do not add the inverse side unless application queries/navigation need it. A unidirectional relation is valid and has less entity coupling.

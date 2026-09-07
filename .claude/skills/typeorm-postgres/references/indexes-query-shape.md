# Indexes and query shape

Load when changing reads, joins, filters, sorting, relation loading, or adding indexes.

## Start from the query

Do not add an index because a column "looks important".

Inspect actual access patterns:

- `WHERE`;
- `JOIN`;
- `ORDER BY`;
- uniqueness checks;
- pagination;
- frequent FK lookups.

Then design the smallest index that supports the important query.

Indexes improve reads but add write/storage maintenance cost.

## Composite indexes

Column order matters.

Match the index to the query predicates and ordering rather than mechanically indexing each column separately.

Do not apply a generic "most selective first" rule without checking PostgreSQL's multicolumn-index behavior and the actual query shape.

## Foreign keys

A PostgreSQL FK does not automatically index the referencing column. Add an index when joins/filtering or parent delete/update checks justify it.

## Query shape

Prefer:

- selecting only required columns;
- explicit relation loading;
- joins when they avoid repeated per-row queries;
- pagination for unbounded collections.

Watch for:

- loops that issue one query per item (N+1);
- broad relations trees that multiply rows and payload;
- `eager: true` on relations not needed by most callers;
- loading entities only to count/check existence when a narrower query exists.

## N+1

If code loads N parent rows and then performs a relation query for each parent, treat it as an N+1 candidate.

Fix by changing the data-access shape: join, relation query strategy, batched query, aggregate query, or dedicated projection depending on the use case.

Do not blindly replace everything with one massive join; large nested joins can also be expensive.

## Verify with PostgreSQL

For material performance work, inspect the generated SQL and use PostgreSQL `EXPLAIN` / `EXPLAIN ANALYZE`.

Do not claim an index improves a query merely because it exists; verify the execution plan when performance matters.

## Concurrent indexes

For large production tables, concurrent index creation may avoid stronger locking, but PostgreSQL/TypeORM transaction requirements differ. Treat this as an explicit migration decision, not a default decorator option.

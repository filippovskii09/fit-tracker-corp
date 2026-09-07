---
name: typeorm-postgres
description: Apply project-specific TypeORM + PostgreSQL persistence rules when changing entities, relations, migrations, constraints, transactions, cascade writes, indexes, or query shape. Use when a backend change can alter stored data, schema integrity, or SQL behavior. Do not use as primary guidance for Nest module structure, auth/security policy, or test strategy; defer those to dedicated skills.
---

# TypeORM + PostgreSQL

Protect schema integrity, transaction boundaries, and query behavior while preserving the project's current direct-repository architecture.

## Before changing persistence code

1. Read the affected entity/entities.
2. Read the latest relevant migrations and the configured TypeORM `DataSource`.
3. Read the service query/write path that uses the entity.
4. Trace relation ownership, FK columns, cascade behavior, and delete semantics.
5. Load only the reference files relevant to the change.

## Core rules

- `synchronize` stays disabled. Any schema-affecting entity change requires a migration.
- Treat entity metadata and migration SQL as two representations of one schema change; review them together.
- Do not trust generated migrations blindly. Read the SQL and verify rename/drop/nullability/default/FK/index behavior.
- Every relation change must explicitly consider owning side / join column, FK existence, nullability, `ON DELETE`, index needs, and cascade behavior.
- Do not use `cascade: true` by default. Enable only the specific cascade operations the aggregate write actually requires.
- Use a transaction when multiple writes must succeed or fail as one business operation.
- Inside a TypeORM transaction, use only the transaction-provided `EntityManager` / repositories derived from it.
- Do not add indexes speculatively. Derive them from real `WHERE`, `JOIN`, `ORDER BY`, uniqueness, and access patterns.
- Do not assume a foreign key automatically creates an index on the referencing column in PostgreSQL.
- Put durable data invariants in PostgreSQL constraints when the database can enforce them reliably; DTO/service validation alone is not enough for concurrency-safe integrity.
- Select only needed fields/relations for read paths; avoid accidental eager graph loading and N+1 query patterns.
- Keep direct TypeORM repositories in services unless repeated complexity creates a real abstraction need.

## Reference routing

Read only when the condition matches:

- `references/schema-migrations.md` — entity columns/schema changes, migration generation/editing, reversibility, destructive operations, production-safe schema evolution.
- `references/relations-integrity.md` — relations, FK/nullability, ownership, `ON DELETE`, orphan behavior.
- `references/transactions.md` — multi-write operations, rollback requirements, isolation, `EntityManager`, `QueryRunner`.
- `references/cascade-writes.md` — nested aggregate persistence, cascade insert/update/remove, orphan handling.
- `references/indexes-query-shape.md` — indexes, composite indexes, joins, sorting, relation loading, N+1, `EXPLAIN`.
- `references/constraints.md` — `NOT NULL`, `UNIQUE`, `CHECK`, FK constraints, concurrency-safe invariants.

## Delegate instead of expanding this skill

- Nest modules/controllers/providers/DI/lifecycle → `nestjs-engineering`.
- Authentication, authorization, ownership/BOLA, JWT/cookies, secrets → `backend-security`.
- Unit/integration/e2e strategy and DB test infrastructure → `backend-testing`.
- General TypeScript modeling → `typescript-engineering`.

## Completion checks

Before finishing persistence work, verify:

- entity metadata and migration agree;
- migration `up` is intentional and `down` is reasonable for the change;
- no destructive rename/drop was generated accidentally;
- FK/nullability/`ON DELETE` semantics match the domain relationship;
- cascade scope cannot create/update/delete unrelated entities;
- all operations that require atomicity share one transaction context;
- constraints enforce durable invariants at the DB boundary;
- indexes correspond to actual query shape;
- relation loading does not introduce obvious N+1 or oversized joins;
- fresh migration run + task-relevant tests/build pass.

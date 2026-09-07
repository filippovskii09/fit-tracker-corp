# Transactions

Load when one business operation performs multiple persistence changes that must be atomic.

## When a transaction is required

Use a transaction when partial success would leave invalid or misleading state, for example:

- parent + dependent writes that are not safely covered by one intended ORM operation;
- write + related counter/state update;
- replace/reorder operations across multiple rows;
- multi-step mutation that first reads state and then writes based on it;
- coordinated delete/update sequences.

Do not add a transaction around a single independent query without a concrete atomicity requirement.

## TypeORM transaction rule

Inside:

```ts
dataSource.manager.transaction(async (transactionalEntityManager) => { ... })
```

all database work that belongs to the transaction must use the provided transactional manager or repositories created from it.

Do not call injected/default repositories from inside the callback and assume they participate in the same transaction.

## QueryRunner

Use `QueryRunner` when explicit connection-level lifecycle/control is required.

If creating a `QueryRunner`, always release it in `finally`.

Prefer `manager.transaction(...)` when explicit runner lifecycle is unnecessary.

## Isolation

Do not change isolation level speculatively.

Escalate isolation only when the actual concurrency anomaly is understood. Higher isolation can increase contention/retries.

For read-modify-write workflows where concurrent updates matter, reason about locking/isolation rather than assuming a transaction alone prevents lost updates.

## External side effects

A database transaction cannot roll back an already-sent HTTP request, email, queue message, or other external side effect.

Do not place slow external calls inside a DB transaction unless there is a deliberate consistency design. For reliable DB + external-event coordination, use an explicit pattern such as an outbox when the requirement exists.

## Failure handling

The transaction boundary should align with the business invariant.

Test rollback behavior for the failure path that matters; success-only tests do not prove atomicity.

# Unit tests and mocking

Load when testing a controller, service, provider, strategy, mapper, or other isolated unit.

## Goal

A unit test answers: given controlled collaborator behavior, does this unit make the correct decision/output?

Use Jest mocks only when the collaborator's real behavior is not what the test must prove.

## Good unit targets

- branching/business decisions;
- transformation/mapping;
- explicit exception decisions;
- orchestration arguments;
- pure helper logic.

## What unit tests do not prove

Mocked/direct-call tests do not prove:

- guards/decorators execute;
- `ValidationPipe` rejects/transforms HTTP input;
- module wiring is correct;
- TypeORM relations/cascades/constraints work;
- PostgreSQL rollback/locking behavior works;
- cookies/headers/status codes are wired;
- migrations apply.

## Mock at the boundary

Mock the smallest collaborator boundary needed.

Do not recreate TypeORM behavior inside repository mocks.

Prefer assertions on:

- returned result;
- thrown error;
- meaningful collaborator calls;
- observable state transition.

Avoid brittle assertions on private methods or incidental internal ordering.

## Controller tests

Direct controller tests are valid for controller-owned delegation/argument behavior.

Use HTTP e2e for routing, guards, pipes, cookies, serialization, interceptors, filters, and actual status/response behavior.

## False confidence check

If the production bug could exist while every mock still returns the expected value, the test is at the wrong level.

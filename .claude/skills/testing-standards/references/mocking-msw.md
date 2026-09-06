# Network Mocking — MSW

Use MSW as the default frontend network boundary when the project already uses
it or when introducing network mocking is explicitly in scope.

MSW intercepts requests at the network layer, allowing application code to use
its real request client while tests control network behavior.

## Handler strategy

- Keep reusable default handlers for common successful behavior.
- Override behavior per test for errors, empty states, latency, permissions, or
  specific edge cases.
- Reset runtime handler overrides between tests.
- Reuse the same domain fixtures/factories where practical.
- Keep handlers aligned with the real API contract.

## Assertions

Prefer asserting the application's observable response to the request:

- rendered data;
- loading/error UI;
- navigation;
- cache/update behavior;
- disabled/enabled actions.

Do not turn MSW handlers into spies merely to assert that a request happened.
Assert request details only when the request shape itself is the behavior under
test and cannot be proven more directly.

## Scope

- Unit/component tests: no real network.
- E2E: follow the project's environment strategy; do not automatically replace
  a real test backend with MSW if the E2E contract is meant to include backend integration.

## Concurrency

If concurrent tests mutate MSW runtime behavior, follow the project's MSW
isolation strategy rather than sharing mutable handler overrides across tests.

## HTTP mocking

Prefer MSW for application HTTP behavior instead of replacing global `fetch`.

MSW should normally cover:
- success responses;
- HTTP errors;
- malformed/error payloads;
- authentication scenarios;
- loading/network failures;
- request headers/body when they are part of the HTTP-client contract.

Use direct `fetch` mocks only when the behavior being tested is specifically the
interaction with `fetch` itself and MSW would obscure that contract.

Do not introduce React Query into tests of a lower-level HTTP client.
Test each abstraction at its own boundary.

## Request assertions

Do not assert every implementation detail of every request.

Assert method, headers, body, or credentials only when they are part of the
behavior owned by the subject under test.

Example:
an HTTP client that owns Bearer-token injection should test Authorization.
A feature using that client normally should not repeat that assertion.
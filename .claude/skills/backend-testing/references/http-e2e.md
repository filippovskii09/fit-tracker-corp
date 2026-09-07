# HTTP e2e tests with Nest and Supertest

Load when correctness depends on the real HTTP/Nest application boundary.

## Use HTTP e2e to prove

- route/path/method wiring;
- global prefix;
- guards/authentication;
- pipes/runtime validation/transformation;
- middleware;
- externally visible interceptors/filters;
- status/response body;
- headers/cookies;
- request parsing;
- application bootstrap.

Use Supertest against `app.getHttpServer()`.

## Bootstrap production-equivalent behavior

Include the production behavior relevant to the endpoint.

If `main.ts` configures a global prefix, `ValidationPipe`, filter, interceptor, or middleware relevant to the assertion, the test must not silently omit it.

Prefer extracting reusable bootstrap configuration over maintaining a divergent fake setup.

## Real vs overridden dependencies

Override only dependencies outside the test scope.

Do not override:

- auth guard when testing auth;
- validation pipe when testing validation;
- service/repository when testing endpoint persistence.

## Assertions

Assert public HTTP contract:

- status;
- body;
- relevant headers;
- `Set-Cookie` attributes where required.

Do not couple e2e tests to private service calls.

Use a Supertest agent/session flow when cookies must persist across requests.

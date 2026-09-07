# Request lifecycle

Load when deciding where request/response cross-cutting behavior belongs.

## Order

For normal HTTP handling, reason in this order:

middleware → guards → interceptors (before) → pipes → controller → service → interceptors (after) → exception filters

Binding scope generally goes global → controller → route. Exception filters resolve from the most specific scope outward.

## Choose the primitive by responsibility

| Concern | Use |
|---------|-----|
| Handler-agnostic request preprocessing | Middleware |
| Authentication/authorization gate or route access decision | Guard |
| Validate or transform handler arguments | Pipe |
| Before/after handler behavior, response transformation, timing, caching-style wrapping | Interceptor |
| Convert uncaught exceptions into HTTP responses | Exception filter |

## Rules

### Guards

Use when the question is: may this request execute this handler?

Guards have `ExecutionContext`, so they can inspect route/controller metadata. Do not put authorization decisions in generic middleware.

For deeper authentication/authorization policy, defer to `backend-security`.

### Pipes

Use for boundary validation/transformation of body, params, and query values.

Do not use a pipe for business rules that require domain state or database access unless the project has a specific established pattern for that rule.

### Interceptors

Use for behavior that wraps execution or transforms the result.

Do not use interceptors as a replacement for:

- route authorization;
- ordinary DTO validation;
- general exception filters.

If a global interceptor/guard needs dependency injection, register it through the Nest module provider mechanism rather than constructing it outside module context.

### Exception filters

Use when centralized exception-to-response handling is actually needed.

Do not add a filter merely because exceptions exist; Nest already handles `HttpException` and unexpected errors.

### Middleware

Use for request preprocessing that does not need knowledge of the selected controller handler or its metadata.

## Sources

- NestJS Request lifecycle: https://docs.nestjs.com/faq/request-lifecycle
- NestJS Guards: https://docs.nestjs.com/guards
- NestJS Interceptors: https://docs.nestjs.com/interceptors
- NestJS Pipes: https://docs.nestjs.com/pipes
- NestJS Exception filters: https://docs.nestjs.com/exception-filters

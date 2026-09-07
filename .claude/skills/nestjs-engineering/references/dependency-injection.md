# Dependency injection

Load when adding providers, provider tokens, factories, scopes, `forwardRef()`, or `ModuleRef`.

## Defaults

- Prefer constructor injection.
- Prefer normal class providers for application services.
- Let the owning module register the provider; consumers import that module.
- Do not manually instantiate injectable application services with `new`.

## Custom providers

Use a custom provider when normal class registration is insufficient, for example:

- injecting a value/configured client;
- selecting an implementation behind a token;
- creating a dependency through a factory;
- aliasing an existing provider.

Use explicit tokens when the runtime cannot use a TypeScript interface as a DI token.

Do not introduce a token/interface pair for every service. It adds value only when the abstraction is consumed independently of one concrete class.

## Provider scope

Default to singleton (`Scope.DEFAULT`).

Use `REQUEST` only when state is truly request-bound, such as specific per-request context that cannot be passed explicitly.

Remember:

- request scope propagates upward through consumers;
- it creates additional instances per request;
- request-scoped dependencies are inappropriate for providers that must remain singleton, such as Passport strategies.

Use `TRANSIENT` only when each consumer genuinely needs a distinct instance.

## Circular dependencies

Do not use `forwardRef()` as the first fix.

Preferred order:

1. remove the bidirectional responsibility;
2. change dependency direction;
3. extract a justified shared capability;
4. only then use `forwardRef()`.

Avoid barrel imports around module/provider classes when they contribute to circular resolution problems.

## ModuleRef

Use `ModuleRef` for dynamic/runtime provider lookup when that behavior is actually required. Do not use it as a service locator to avoid explicit constructor dependencies.

## Sources

- NestJS Providers: https://docs.nestjs.com/providers
- NestJS Custom providers: https://docs.nestjs.com/fundamentals/custom-providers
- NestJS Injection scopes: https://docs.nestjs.com/fundamentals/injection-scopes
- NestJS Circular dependency: https://docs.nestjs.com/fundamentals/circular-dependency

# Architecture boundaries

Load when changing feature modules, controllers/services, cross-feature dependencies, exports, or architecture layers.

## Project baseline

The backend currently follows feature folders with module → controller → service, while services contain business logic and direct TypeORM repository access. Preserve this shape unless the task provides evidence that another layer is needed.

## Decision rules

### Feature module

A feature module owns a cohesive capability.

- Keep its controller and primary providers inside that module.
- Keep providers private unless another module actually consumes them.
- Export the provider that forms the cross-feature API; do not export every internal provider.
- A consumer imports the owning module rather than re-registering the provider locally.

### Controller vs service

Controller responsibilities:

- route/decorator binding;
- extraction of params/query/body/current request context;
- delegation to providers;
- HTTP-facing return/exception behavior.

Service/provider responsibilities:

- application/business decisions;
- orchestration across dependencies;
- persistence calls in the project's current architecture.

Do not move simple orchestration into extra "use case", "manager", or repository layers without a concrete reason.

### Cross-feature dependencies

When feature A needs behavior owned by feature B:

- Prefer calling a provider exported by B.
- Import B's module into A.
- Avoid reaching directly into B's persistence internals to bypass B's behavior.
- Avoid duplicating/re-registering B's provider in A.

A TypeScript import alone does not establish Nest DI ownership; the module graph must provide the dependency.

### Global modules

Use `@Global()` only for infrastructure that is genuinely application-wide. Do not use it to avoid explicit imports.

Explicit module imports make dependency direction visible.

### Circular dependencies

A new cycle usually means responsibilities are pointing both directions.

Before `forwardRef()`:

- identify the shared responsibility;
- move it to the correct owner or a small third provider/module if justified;
- reduce one direction of dependency.

Use `forwardRef()` only when the cycle is legitimate and refactoring would be worse than the cycle.

### Abstractions

Do not add:

- repository interfaces around one TypeORM repository;
- CQRS for ordinary CRUD/application flows;
- domain layers that only mirror DTO/entity fields;
- generic "base service" abstractions with no repeated behavior.

Add abstraction when it creates a real seam: multiple implementations, repeated policy, significant query complexity, transactional boundary, external integration, or established project convention.

## Sources

- NestJS Modules: https://docs.nestjs.com/modules
- NestJS Providers: https://docs.nestjs.com/providers
- NestJS Circular dependency: https://docs.nestjs.com/fundamentals/circular-dependency

---
name: nestjs-engineering
description: Apply project-specific NestJS engineering conventions when implementing or reviewing Nest modules, controllers, providers/services, DTO validation, guards, pipes, interceptors, exception filters, or dependency injection wiring. Use for backend changes that alter Nest application structure or HTTP request lifecycle. Do not use as primary guidance for TypeORM schema/query design, security policy, or test strategy; defer those to dedicated skills.
---

# NestJS Engineering

Keep Nest boundaries and request semantics correct while preserving the project's existing architecture. Prefer the smallest change that fits current patterns.

## Before changing code

- Read the affected feature module, controller, service/provider, and relevant bootstrap/config.
- Trace the path: request → Nest lifecycle components → controller → service/provider → persistence.
- Identify which module owns each provider and which providers are intentionally exported.
- Load only the reference files relevant to the change.

## Core rules

- Keep controllers transport-focused: bind HTTP input, call providers, return results. Keep business decisions and persistence out of controllers.
- Keep application/business orchestration in services/providers. Do not split providers merely to create more layers.
- Treat module exports as a public API. Cross-feature provider access goes through module imports + explicit exports.
- Do not make modules global for convenience.
- Do not introduce repository, domain, CQRS, mediator, or other abstraction solely because it is considered "clean architecture". This project currently keeps TypeORM repositories in services.
- Treat a new circular dependency as a design smell. Refactor responsibilities before reaching for `forwardRef()`.
- Use singleton provider scope by default. Use request/transient scope only for a concrete lifetime requirement.
- Validate HTTP input at the transport boundary using runtime-capable DTO classes and Nest pipes.
- Use the Nest primitive that matches the concern:
  - guard → whether execution may proceed;
  - pipe → input validation/transformation;
  - interceptor → logic around handler execution / response;
  - exception filter → uncaught exception-to-response handling;
  - middleware → handler-agnostic request preprocessing.
- Use standard Nest HTTP exceptions for expected HTTP failures unless an established project error contract requires otherwise.
- Preserve existing local conventions unless the task explicitly changes them.

## Reference routing

Read only when the condition matches:

- `references/architecture-boundaries.md` — adding/changing modules, cross-feature dependencies, exports, global modules, controller/service responsibilities, or architectural abstractions.
- `references/dependency-injection.md` — custom providers, provider tokens, scopes, `forwardRef`, `ModuleRef`, or unusual DI wiring.
- `references/request-lifecycle.md` — deciding between middleware, guards, pipes, interceptors, filters, or changing global/controller/route bindings.
- `references/dto-validation.md` — DTOs, params/query/body validation, nested validation, transforms, or mapped DTOs.
- `references/error-handling.md` — HTTP exceptions, exception filters, error translation, or response error contracts.

## Delegate instead of expanding this skill

- Entity/schema/migration/relation/query/index/transaction work → `typeorm-postgres`.
- Authentication, authorization, ownership, JWT/cookies, CSRF, secrets → `backend-security`.
- Unit/integration/e2e strategy and implementation → `backend-testing`.
- General TypeScript modeling → `typescript-engineering`.

## Completion checks

Before finishing a Nest structural change, verify:

- providers are resolvable through the intended module graph;
- module exports expose only what consumers need;
- controllers contain no persistence logic;
- no new circular/global/request-scoped dependency was added without a concrete reason;
- DTO runtime validation still matches the HTTP contract;
- the selected lifecycle primitive matches the concern;
- build/typecheck and the task-relevant tests pass.

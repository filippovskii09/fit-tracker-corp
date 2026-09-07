# Backend Boundaries

Apply to all changes under `backend/`.

## Feature ownership

* Preserve feature ownership: module → controller → service.
* Controllers stay transport-focused; business logic and persistence stay in services/providers.
* Preserve existing feature-folder conventions unless the task explicitly changes architecture.

## Cross-feature access

* Cross-feature dependencies must go through Nest module imports + explicit provider exports.
* Do not re-register another feature's provider locally just to access it.
* Do not reach into another feature's persistence internals when its exported service owns that behavior.
* Keep providers private unless another module actually consumes them.

## Imports

* Use `@src/*` for cross-domain/shared imports.
* Use relative imports inside the same feature.

## Abstractions

* Do not introduce `@Global()`, `forwardRef()`, `ModuleRef`, repository/domain/CQRS layers, or new abstractions without a concrete requirement.
* A new circular dependency is a design problem first; refactor responsibility before using `forwardRef()`.

For detailed NestJS decisions, use `nestjs-engineering`.

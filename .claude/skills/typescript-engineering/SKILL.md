---
name: typescript-engineering
description: >
  Apply TypeScript engineering conventions when designing or changing types,
  public APIs, domain/state models, trust boundaries, generic utilities, or
  escape-hatch usage. Use for TypeScript implementation decisions that affect
  correctness, maintainability, API design, or compiler complexity. Do not use
  as a basic TypeScript syntax guide.
---

# TypeScript Engineering

Use TypeScript to model real program constraints, not to decorate JavaScript
with annotations.

Follow project-specific type conventions when they are more specific. Prefer the
simplest type design that preserves the required safety and clarity.

## Core decisions

- Model meaningful states explicitly; avoid invalid combinations when a small
  discriminated union or clearer model can prevent them.
- Treat external/untrusted data as `unknown` until validated or narrowed.
- Prefer local inference when the compiler already knows the type.
- Make exported/public contracts precise and stable.
- Use generics only when they express a real relationship between types.
- Keep unsafe escape hatches local, visible, and justified.
- Prefer readable named types over deeply nested clever type expressions.
- Do not solve runtime validation problems with compile-time assertions.

## Route to references

Load only the relevant reference:

- Domain/state modeling, discriminated unions, invalid states:
  `references/type-modeling.md`
- API responses, storage, JSON, third-party data, runtime validation:
  `references/trust-boundaries.md`
- Inference, public APIs, exported types, `satisfies`:
  `references/inference-api-design.md`
- Generics, constraints, mapped/conditional/indexed types:
  `references/generics-advanced.md`
- `any`, assertions, non-null assertions, suppressions:
  `references/escape-hatches.md`
- Complex types, compiler/editor performance, maintainability:
  `references/compiler-performance.md`

Do not load unrelated references.

## Guardrails

- Do not add explicit annotations when inference is already clear and stable.
- Do not use `as` to claim that unvalidated external data matches a domain type.
- Do not introduce generics for hypothetical reuse.
- Do not create type-level abstractions that are harder to understand than the
  runtime code they describe.
- Do not silence compiler errors with `any`, `as`, `!`, or `@ts-ignore` before
  checking whether the underlying model is wrong.
- Do not duplicate runtime schemas manually when the project already has a
  single-source-of-truth strategy.
- Do not redesign unrelated types while solving a local task.

## Tooling boundary

Compiler and lint rules own mechanical enforcement.

This skill owns design decisions the compiler cannot choose for you:
modeling, boundary trust, API precision, abstraction cost, and safe use of
escape hatches.

Do not duplicate diagnostics already enforced by `tsc` or typed ESLint unless
they expose a broader type-design problem.

## Global type augmentation

- Use `declare global` only for real runtime globals provided by the platform or external scripts.
- Keep global augmentations in dedicated `.d.ts` files, not feature/component implementation files.
- Model only the API surface the application actually uses.
- Do not use global augmentation as a shortcut for normal application types.

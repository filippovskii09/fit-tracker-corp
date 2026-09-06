# Compiler and Type-System Performance

Type complexity affects editor responsiveness, compiler work, and maintenance.

## Prefer

- named reusable types over repeated complex inline expressions;
- interfaces for reusable object shapes when extension/composition is useful;
- base types/extension over very large repeated intersections;
- smaller unions when the same contract can be modeled more directly;
- explicit return annotations at expensive public boundaries when inference
  produces very large exported types.

## Avoid

- deeply recursive conditional types without a concrete need;
- giant manually generated unions;
- repeated intersections of large object types;
- enormous inferred exported types;
- advanced type-level programming for ordinary application logic.

## Diagnose before optimizing

Do not simplify useful type safety based on intuition alone.

If checking/editor performance becomes a problem, use TypeScript diagnostics or
tracing and isolate the expensive type first.

## Maintainability

A type that only its author can understand is an engineering cost even if it
compiles quickly.

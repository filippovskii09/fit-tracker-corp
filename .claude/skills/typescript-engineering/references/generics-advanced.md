# Generics and Advanced Types

Use generics to express relationships, not to make code appear reusable.

## Good generic use

A generic should usually connect at least two things, for example input to
output, object to key, or collection element to callback/result.

If a type parameter appears only once and adds no useful constraint, question
whether it should exist.

## Constraints

Use the narrowest useful constraint.

Use `keyof`, indexed access, mapped, conditional, or template-literal types only
when they materially improve the contract.

## Avoid

- generics for hypothetical future callers;
- deep conditional-type puzzles for ordinary application code;
- long chains of inferred helper types that obscure the public API;
- type-level duplication of runtime logic.

## Complexity rule

When a sophisticated type is required, name intermediate types, keep the public
API simpler than the implementation, and add type tests when regressions would
be hard to detect.

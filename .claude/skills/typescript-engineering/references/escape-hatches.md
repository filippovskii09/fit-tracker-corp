# Escape Hatches

Treat unsafe TypeScript constructs as localized exceptions.

## Preference order

Prefer:

1. correct modeling / narrowing;
2. `unknown` + validation;
3. a narrow local assertion;
4. `any` only when the type system or external library genuinely cannot express
   the boundary.

## `any`

If unavoidable, keep it at the smallest boundary and convert it to a safer type
immediately.

Do not expose it from public application APIs without a strong reason.

## `as`

Do not use assertions to bypass missing validation or an incorrectly modeled
state.

## `!`

Use a non-null assertion only when the lifecycle guarantees presence but the
compiler cannot prove it.

## Suppressions

Avoid `@ts-ignore`.

If suppression is unavoidable, prefer `@ts-expect-error` and document why.

Do not use suppressions merely to make a gate green.

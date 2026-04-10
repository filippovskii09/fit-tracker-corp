---
name: tailwind-rules
description: Use when adding or reviewing Tailwind classes in this repo, especially arbitrary values, spacing/sizing utilities, shadows, colors, responsive sizing, and class cleanup. Prefer Tailwind theme tokens and built-in scale utilities over hardcoded pixel or color literals.
---

# Tailwind Rules

Use this skill when editing Tailwind class strings or reviewing Tailwind-heavy frontend diffs.

## Core Rules

1. Prefer built-in utilities before arbitrary values.
   Use scale classes like `min-h-15.5`, `max-w-md`, `text-xl`, `p-5`, and `rounded-3xl` when they express the same value clearly.

2. Prefer repo tokens before one-off values.
   Shared design values should live in `frontend/tokens/design-tokens.json`, then be generated into Tailwind `@theme` variables and imported by MUI constants.

3. Treat `frontend/tokens/design-tokens.json` as the design-token source of truth.
   Component-level CSS, Tailwind classes, and `sx` styles may reference CSS variables with `var(...)`.

4. Do not put CSS variables into MUI theme files.
   MUI may parse palette values at runtime, so `frontend/src/theme/**/*.ts` must use concrete values from `frontend/tokens/design-tokens.json`, not `var(--...)`.

5. Use arbitrary values only when the value is genuinely contextual.
   Acceptable examples: responsive `clamp(...)`, layout-specific `calc(...)`, grid formulas, or a value that would be less clear as a named token.

6. Never hardcode reusable colors or shadows in Tailwind classes.
   Prefer `bg-primary`, `text-text-subtle`, `border-border-subtle`, `shadow-primary-glow`, or add a token to `@theme`.

## Review Checklist

- Can any `[...]` class be replaced by a built-in Tailwind utility?
- If an arbitrary value remains, is it layout-specific rather than a reusable design token?
- Are colors, alpha overlays, and shadows coming from `frontend/src/index.css` tokens?
- Are shared sizing values represented as `--spacing-*` tokens when used in both Tailwind and MUI?
- Are `frontend/src/theme/**/*.ts` files free of `var(--...)` strings?
- If `frontend/tokens/design-tokens.json` changed, did `npm run tokens` update generated files?
- Did `npm run tokens --prefix frontend` run before validation?

## Useful Searches

```bash
rg -n "\[[^]]+\]|rgba\(|#[0-9A-Fa-f]{3,8}|shadow-\[" frontend/src -S
```

Run this before finalizing a Tailwind styling change and either replace matches or leave a deliberate reason.

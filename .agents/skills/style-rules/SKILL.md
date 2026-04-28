---
name: style-rules
description: Use when adding or editing frontend styles in this repo, especially for colors, spacing, surfaces, Tailwind theme tokens, MUI sx props, or visual loading states. Enforces project styling consistency and centralized design tokens before introducing new inline values.
---

# Style Rules

Apply these rules whenever a change touches frontend styling.

## Core Rules

1. Do not hardcode reusable visual tokens in components.
   Colors, overlay alphas, spacing scales, radii, shadows, and similar design-system values must come from a centralized source first.

2. Prefer existing project tokens before creating new ones.
   Check [`frontend/tokens/design-tokens.json`](../../../../frontend/tokens/design-tokens.json) first.
   Generated Tailwind tokens live in [`frontend/src/styles/tokens.css`](../../../../frontend/src/styles/tokens.css).
   MUI constants live in [`frontend/src/theme/constants.ts`](../../../../frontend/src/theme/constants.ts) and import token JSON directly.
   MUI overrides live in [`frontend/src/theme/index.ts`](../../../../frontend/src/theme/index.ts).

3. Add new tokens at the lowest shared layer that matches the usage.
   Use `frontend/tokens/design-tokens.json` for reusable app-wide values, then run `npm run tokens --prefix frontend`.
   Use component-local styles only for values that are not part of the design language.

4. Keep feature PRs narrow.
   If a broader style cleanup is useful but outside the issue scope, leave a short TODO instead of expanding the diff.

## Review Checklist

- Are any colors or overlay alphas hardcoded in JSX, `sx`, or class strings?
- Could the value reuse an existing token?
- If a new token was needed, was it added to `frontend/tokens/design-tokens.json`?
- Did generated token files stay untouched manually?
- Did `npm run tokens:check --prefix frontend` pass?
- Did the change avoid mixing feature logic with token definitions?

## Current Repo Rule 1

Never add raw color values like `rgba(...)`, hex, or arbitrary color literals directly inside component `sx` styling when the value is part of the design language.
Create or reuse a centralized token first.

## Current Repo Rule 2

Do not use CSS custom properties inside `frontend/src/theme/**/*.ts`.
MUI may parse palette values at runtime, so theme files must consume concrete values from `frontend/src/theme/constants.ts`.

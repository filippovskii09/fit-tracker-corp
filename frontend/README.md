# Frontend

The frontend is a Vite React application for the Fit Tracker Corp workout experience. It owns the calendar dashboard, authentication screens, workout creation flow, workout viewing flow, and shared UI components.

## Stack

- React 19
- TypeScript
- Vite with Tailwind CSS v4
- MUI for form controls, dialogs, and selected UI primitives
- Formik and Yup for forms and validation
- TanStack Query for server state
- Jest and Testing Library for tests
- ESLint and Prettier for code quality

## Structure

```text
frontend/
├── src/
│   ├── api/             # API client setup
│   ├── components/      # Shared and feature-level UI components
│   ├── config/          # Frontend configuration
│   ├── constants/       # App route and static constants
│   ├── hooks/           # Shared React hooks
│   ├── layouts/         # Route layouts
│   ├── locales/         # UI copy dictionaries
│   ├── pages/           # Route-level page components
│   ├── router/          # Routing and route guards
│   ├── services/        # API service wrappers
│   ├── styles/          # Generated Tailwind token CSS
│   ├── theme/           # MUI theme and token bridge
│   ├── types/           # Shared TypeScript types
│   └── utils/           # Shared utilities
├── scripts/             # Local build/generation scripts
└── tokens/              # Frontend design token source
```

## Design Tokens

The frontend uses a small design-token pipeline so Tailwind and MUI do not drift apart.

Design tokens are reusable UI decisions: colors, spacing, typography sizes, shadows, focus colors, and similar values. Tailwind v4 exposes these through `@theme` variables, which generate utilities like `bg-primary`, `text-text-subtle`, `min-h-control-lg`, and `shadow-primary-glow`.

### Why This Exists

The app uses both Tailwind utility classes and MUI components. If colors and shadows are copied manually into both CSS and TypeScript theme files, they will eventually diverge.

MUI theme files should not use CSS custom properties for palette values, for example `primary.main: 'var(--color-primary)'`. MUI may parse palette values in JavaScript at runtime to derive contrast and variants. CSS variables are valid browser CSS, but they are not concrete JS color values, so this can pass build checks and still fail in the browser.

The current pipeline keeps one token source and gives each styling system the format it needs:

```text
frontend/tokens/design-tokens.json
  -> imported by frontend/src/theme/constants.ts
  -> generated frontend/src/styles/tokens.css
```

### Files

`tokens/design-tokens.json` is the source of truth. Edit this file when changing shared colors, shadows, reusable control sizes, or semantic text sizes.

`src/theme/constants.ts` is tracked source code. It imports `tokens/design-tokens.json` and exposes concrete token values to MUI.

`src/styles/tokens.css` is generated and ignored by Git. It contains Tailwind `@theme` variables and app-level CSS variables. Do not edit it directly.

`src/theme/index.ts` consumes `PALETTE` constants and defines MUI component overrides.

### Commands

Run these from `frontend/`:

```bash
npm run tokens
```

Regenerates `src/styles/tokens.css` from `tokens/design-tokens.json`.

```bash
npm run tokens:check
```

Checks that generated token CSS is up to date without rewriting it.

```bash
npm run dev
npm run build
npm run lint
npm run test
```

These commands regenerate token CSS before running, so a clean checkout works without committing generated CSS.

### Rules

Do not edit generated token files directly.

Do not use `var(--...)` in `src/theme/**/*.ts`. MUI theme files need concrete values because MUI can parse palette colors at runtime.

Use CSS variables in component-level CSS or `sx` only when the value is passed directly to the browser and does not need MUI color parsing.

Prefer Tailwind token utilities over arbitrary values. For example, use `min-h-control-lg`, `shadow-primary-glow`, or `text-workout-title` instead of repeating pixel or shadow literals.

If a reusable value is needed in both Tailwind and MUI, add it to `tokens/design-tokens.json`, run `npm run tokens`, and consume it from Tailwind utilities or `PALETTE`.

## References

- Tailwind theme variables: https://tailwindcss.com/docs/theme
- Tailwind custom colors with `@theme`: https://tailwindcss.com/docs/customizing-colors
- MUI theming: https://mui.com/material-ui/customization/theming/
- Style Dictionary is a larger industry tool for generating platform-specific token outputs: https://v4.styledictionary.com/

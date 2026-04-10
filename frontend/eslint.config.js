import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/theme/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/var\\(--/]',
          message:
            'Do not use CSS custom properties in MUI theme files. MUI may parse palette values at runtime, so use concrete color values here and keep CSS vars in component styles.',
        },
        {
          selector: 'TemplateElement[value.raw=/var\\(--/]',
          message:
            'Do not use CSS custom properties in MUI theme files. MUI may parse palette values at runtime, so use concrete color values here and keep CSS vars in component styles.',
        },
      ],
    },
  },
]);

import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Build output, dependencies and the PHP backend are not part of the
  // JavaScript frontend lint surface. `backend/vendor` in particular ships
  // thousands of third-party files that would otherwise flood the report.
  globalIgnores(['dist', 'backend/**', 'node_modules/**', 'coverage/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react,
    },
    rules: {
      // Core no-unused-vars cannot see JSX references, so teach it that a
      // component used as <Component /> counts as a usage.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // This project uses the automatic JSX runtime; no React import needed.
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    // Node-side tooling: Vite config, Express/Stripe server, scripts.
    files: ['vite.config.js', 'server/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])

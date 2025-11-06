// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

/**
 * ESLint Flat Config – Next.js + TypeScript + React Hooks + Prettier
 */
export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    // lint only source files to avoid scanning generated artifacts (dist, .next)
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    ignores: [
      'node_modules/',
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      '*.config.js',
      '**/*.config.js',
      // ignore Next build artifacts and generated types
      '**/.next/**',
      '**/*.buildinfo',
    ],
    languageOptions: {
      parserOptions: {
        // use the repo tsconfigs (tsconfig.base.json doesn't exist in this repo)
        project: ['tsconfig.json', 'tsconfig.build.json'],
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    // merge core-web-vitals rules as well as recommended rules
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...reactHooks.configs.recommended.rules,

      // --- Base ---
      'no-console': 'warn',
      'no-debugger': 'warn',
      'no-empty': 'off',
      'no-unsafe-finally': 'off',

      // --- TypeScript ---
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^(_|e\\d?)$', varsIgnorePattern: '^(__|[A-Z_])' },
      ],
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'off',

      // --- React Hooks ---
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // --- Next.js ---
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  // overrides for node scripts (helpers, build scripts, etc.)
  {
    files: ['scripts/**/*.{js,cjs,mjs}'],
    languageOptions: {
      parserOptions: {
        sourceType: 'script',
      },
      globals: {
        process: 'readonly',
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
      },
    },
    rules: {
      // allow console in scripts and commonjs require usage
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  prettier,
);

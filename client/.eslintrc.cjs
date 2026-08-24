module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    // Catches the unlabelled icon buttons and click-only divs that the audit
    // turned up by hand
    'plugin:jsx-a11y/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh', 'jsx-a11y'],
  rules: {
    // This project has no TypeScript and no runtime prop validation; the rule
    // fired on every component and drowned out real findings.
    'react/prop-types': 'off',
    // Was 'off', which is exactly why the reverse-tabnabbing in RenderMessage
    // survived. Leave it on.
    'react/jsx-no-target-blank': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  overrides: [
    {
      // Providers intentionally export both a component and its hook
      files: ['src/context/*.jsx'],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
}

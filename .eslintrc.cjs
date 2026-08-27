/**
 * Lint config for the server. There was none before, which is how a no-op
 * `socket.off(...)` call and an unused debug import survived in production.
 */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ["eslint:recommended"],
  parserOptions: { ecmaVersion: "latest", sourceType: "script" },
  ignorePatterns: ["client", "node_modules", "coverage"],
  rules: {
    "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    eqeqeq: ["error", "smart"],
    "no-var": "error",
    "prefer-const": "error",
  },
  overrides: [
    {
      // Vitest runs with globals enabled (see vitest.config.js)
      files: ["**/*.test.js"],
      env: { node: true },
      globals: {
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  ],
};

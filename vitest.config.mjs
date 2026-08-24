import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["server/**/*.test.js"],
    //An in-memory MongoDB is spun up per suite, which takes a moment on a
    //cold start
    testTimeout: 30000,
    hookTimeout: 60000,
    //These suites share one database, so run them one at a time
    fileParallelism: false,
  },
});

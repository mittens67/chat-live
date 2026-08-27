/**
 * Fail fast on missing configuration.
 *
 * Without this, a missing JWT_SECRET stays invisible until the first login
 * attempt, and a missing MONGO_URI surfaces as a confusing driver error.
 */

const REQUIRED = ["MONGO_URI", "JWT_SECRET"];

const validateEnv = () => {
  const missing = REQUIRED.filter((key) => !process.env[key]);

  if (missing.length) {
    console.error(
      `Missing required environment variable(s): ${missing.join(", ")}\n` +
        `Copy .env.example to .env and fill them in.`
    );
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error(
      "JWT_SECRET is too short to be safe. Generate one with: openssl rand -hex 32"
    );
    process.exit(1);
  }

  if (!["development", "production", "test"].includes(process.env.NODE_ENV)) {
    //Not fatal, but both the static-file branch and the stack-trace branch key
    //off this, so a typo silently changes behaviour
    console.warn(
      `NODE_ENV is "${process.env.NODE_ENV}" - expected development, production or test. Treating as production.`
    );
  }
};

module.exports = validateEnv;

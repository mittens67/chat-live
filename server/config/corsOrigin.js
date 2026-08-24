/**
 * Single source of truth for the allowed CORS origin.
 *
 * Both the HTTP layer (app.js) and the Socket.io layer (server.js) need this,
 * and they must agree - a websocket that accepts an origin the REST API
 * rejects is a hole, not a convenience.
 *
 * Read at call time rather than at module load so that anything setting
 * NODE_ENV after require() still gets the right answer.
 *
 * @returns {false|string} false means "no cross-origin allowance at all",
 *   which is correct in production where Express serves the client itself.
 */
const getCorsOrigin = () =>
  process.env.NODE_ENV === "production"
    ? false
    : process.env.CORS_ORIGIN || "http://localhost:5173";

module.exports = getCorsOrigin;

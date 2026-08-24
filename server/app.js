const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const getCorsOrigin = require("./config/corsOrigin");

/**
 * Builds the Express app.
 *
 * Kept separate from server.js so tests can mount it without binding a port
 * or opening a database connection of their own.
 */
const createApp = () => {
  const app = express();
  const isProduction = process.env.NODE_ENV === "production";

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "100kb" }));
  app.use(
    cors({
      //A concrete origin, not "*" - the wildcard is invalid alongside
      //credentials and browsers reject the combination outright
      origin: getCorsOrigin(),
      credentials: true,
      methods: ["GET", "POST", "HEAD", "PUT", "PATCH", "DELETE"],
      //Authorization was missing here, which broke preflight for every
      //authenticated cross-origin request
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  //Brute-forcing login was free before this
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    //Rate limiting fights with the test suite, which registers many users
    skip: () => process.env.NODE_ENV === "test",
    message: { message: "Too many attempts, please try again later" },
  });

  app.use("/api/user/login", authLimiter);
  app.use("/api/user", (req, res, next) =>
    req.method === "POST" && req.path === "/"
      ? authLimiter(req, res, next)
      : next()
  );

  app.use("/api/user", userRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/message", messageRoutes);

  //Unmatched /api routes must 404 as JSON. Registering this before the SPA
  //catch-all below is what stops a typo'd endpoint returning index.html with
  //status 200 and blowing up the client's JSON.parse.
  app.use("/api", notFound);

  if (isProduction) {
    //__dirname, not path.resolve() - the latter resolves the *working
    //directory*, so serving broke if the process started anywhere but the root
    const clientDist = path.join(__dirname, "..", "client", "dist");

    app.use(express.static(clientDist));
    app.get("*", (req, res) =>
      res.sendFile(path.join(clientDist, "index.html"))
    );
  } else {
    app.get("/", (req, res) => {
      res.send("API is running");
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;

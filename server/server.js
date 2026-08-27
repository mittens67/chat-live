const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const validateEnv = require("./config/validateEnv");
const connectDB = require("./config/db");
const createApp = require("./app");
const registerSocketHandlers = require("./socket");
const getCorsOrigin = require("./config/corsOrigin");

validateEnv();
connectDB();

const app = createApp();
const PORT = process.env.PORT || 3000;

//An arrow function, so this logs once the port is actually bound rather than
//at argument-evaluation time
const server = app.listen(PORT, () =>
  console.log(`Server listening on port ${PORT}`)
);

const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    //Same rule as the HTTP layer, from one shared source
    origin: getCorsOrigin(),
    methods: ["GET", "POST"],
    credentials: true,
  },
});

//Controllers reach the socket layer through req.app.get("io") so they can fan
//out messages themselves. Absent in tests, which mount the app without sockets.
app.set("io", io);

registerSocketHandlers(io);

const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  //Don't hang forever if connections refuse to drain
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

module.exports = { app, server, io };

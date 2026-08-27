const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongoServer;

/** Boots an in-memory MongoDB and points mongoose at it. */
const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer?.stop();
};

const clearTestDB = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
};

/**
 * Builds the Express app with test configuration.
 *
 * The database connection belongs to the harness above, which is why the app
 * factory is kept separate from server.js's bootstrap.
 */
const loadApp = () => {
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || "test-secret-that-is-long-enough-to-pass-checks";
  process.env.NODE_ENV = "test";

  const createApp = require("../app");
  return createApp();
};

module.exports = { connectTestDB, disconnectTestDB, clearTestDB, loadApp };

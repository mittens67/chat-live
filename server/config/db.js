const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Mongo DB connected: ${conn.connection.host}`);
  } catch (err) {
    //Never log MONGO_URI itself, it carries the password
    console.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

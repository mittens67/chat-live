const mongoose = require("mongoose");

const connectDB = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Mongo DB connected: ${conn.connection.host}`)
    } catch(err) {
        console.log(`Error: ${err.message}`);
        console.log(`Error: ${process.env.MONGO_URI}`);
        process.exit();
    }
}


module.exports = connectDB;


/**
 * These are options that are not needed anymore, leaving it here anyway
 * 
 * , {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }
 */
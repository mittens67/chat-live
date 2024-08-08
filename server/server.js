const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

//Meant for debugging
const util = require('util');

const corsOpts = {
    origin: '*',
    credentials: true,
    methods: ['GET','POST','HEAD','PUT','PATCH','DELETE'],
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['Content-Type']
};

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.use(cors(corsOpts));


app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

/*****************************************************For Deployment***************************************** */
const __dirname1 = path.resolve();
//Change to dev during dev
if(process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname1, "/client/dist/")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "client", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running");
  });
}

/*****************************************************For Deployment***************************************** */

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, console.log(`Server on PORT ${PORT}`));


const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
        origin: '*',
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: false
    }
});


io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on('setup', (userData) => {
    socket.join(userData._id);
    console.log(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log("User joined the room" + room);
  })

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageRecieved) => {
  
    let chat = newMessageRecieved.chat;
    //console.log(`We got the chat info ${chat.users}`);
    console.log(util.inspect(chat, {showHidden: false, depth: null, colors: true}))

    if(!chat.users) return console.log('chat.users not defined');

    
    chat.users.forEach((user) => {
      if(user._id === newMessageRecieved.sender._id) return;
      console.log(user._id, newMessageRecieved.sender._id);
      socket.in(user._id).emit('message recieved', newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("USER DISCONNECTED");
    socket.leave(userData._id);
  });
});
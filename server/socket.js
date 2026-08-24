const { verifyToken } = require("./middleware/authMiddleware");
const User = require("./models/userModel");
const Chat = require("./models/chatModel");

/**
 * Socket.io wiring.
 *
 * The guiding rule here: never trust the client for identity or for who
 * receives a message. The socket's user comes from a verified JWT, and the
 * recipient list is read from the database, not from the emitted payload.
 */
const registerSocketHandlers = (io) => {
  //Handshake authentication. Previously anyone could emit "setup" with a
  //victim's id and start receiving their private messages.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return next(new Error("Invalid token"));
    }

    const user = await User.findById(decoded.id).select("name picture email");

    if (!user) {
      return next(new Error("User no longer exists"));
    }

    socket.user = user;
    next();
  });

  io.on("connection", (socket) => {
    //The room comes from the verified token, never from a client payload
    socket.join(socket.user._id.toString());
    socket.emit("connected");

    socket.on("join chat", async (room) => {
      //Joining a chat room requires actually being in that chat
      const chat = await Chat.findOne({ _id: room, users: socket.user._id });

      if (chat) {
        socket.join(room);
      }
    });

    socket.on("typing", (room) => socket.to(room).emit("typing"));
    socket.on("stop typing", (room) => socket.to(room).emit("stop typing"));

    socket.on("new message", async (newMessage) => {
      const chatId = newMessage?.chat?._id;

      if (!chatId) return;

      //Load the members from the database rather than trusting the payload's
      //user list, which a malicious client could point at anyone
      const chat = await Chat.findOne({
        _id: chatId,
        users: socket.user._id,
      }).select("users");

      if (!chat) return;

      chat.users.forEach((userId) => {
        if (userId.equals(socket.user._id)) return;
        socket.to(userId.toString()).emit("message recieved", newMessage);
      });
    });

    socket.on("disconnect", () => {
      //socket.io removes the socket from its rooms automatically; this is here
      //for observability and for anything we want to clean up later
    });
  });
};

module.exports = registerSocketHandlers;

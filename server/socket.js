const { verifyToken } = require("./middleware/authMiddleware");
const User = require("./models/userModel");
const Chat = require("./models/chatModel");
const {
  isUserOnline,
  filterOnline,
  announcePresence,
} = require("./lib/presence");

/**
 * Socket.io wiring.
 *
 * The guiding rule here: never trust the client for identity or for who
 * receives a message. The socket's user comes from a verified JWT, and every
 * handler that touches a chat re-checks membership against the database.
 *
 * Note there is no "new message" handler. Messages are fanned out server-side
 * from the controller that persists them (see lib/broadcast.js) so that what
 * recipients render is always what was actually stored.
 */
const registerSocketHandlers = (io) => {
  /**
   * A handshake rejection the client can recognise.
   *
   * Flagged so the client can tell a refused token from a dropped network and
   * stop reconnecting - retrying with the same bad token never succeeds, and
   * every attempt costs a database lookup here.
   */
  const authError = (message) => {
    const error = new Error(message);
    error.data = { code: "AUTH_FAILED" };
    return error;
  };

  //Handshake authentication. Previously anyone could emit "setup" with a
  //victim's id and start receiving their private messages.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(authError("Authentication required"));
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return next(authError("Invalid token"));
    }

    const user = await User.findById(decoded.id).select("name picture email");

    if (!user) {
      return next(authError("User no longer exists"));
    }

    socket.user = user;
    next();
  });

  /**
   * Note this handler is deliberately NOT async.
   *
   * Every listener below must be attached synchronously. Awaiting anything
   * before they are registered opens a window where the client has been told
   * it is connected but the server is not yet listening - events sent in that
   * gap are dropped on the floor and their acks never fire.
   */
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    /**
     * Registers an async handler that cannot fail silently.
     *
     * Without this, a rejected handler is an unhandled rejection and any ack
     * the caller is awaiting never fires - the client just hangs.
     */
    const on = (event, handler) => {
      socket.on(event, async (...args) => {
        const ack = args[args.length - 1];

        try {
          await handler(...args);
        } catch (error) {
          console.error(`socket "${event}" failed:`, error.message);
          if (typeof ack === "function") ack({ error: "Request failed" });
        }
      });
    };

    //The room comes from the verified token, never from a client payload.
    //This room doubles as the presence signal - see lib/presence.js
    socket.join(userId);

    /** Membership check shared by every chat-scoped handler below. */
    const memberOf = async (chatId) => {
      if (!chatId) return null;
      return Chat.findOne({ _id: chatId, users: socket.user._id }).select(
        "users"
      );
    };

    //Acknowledged, so the caller knows whether it is actually in the room.
    //This used to no-op silently on failure, which meant a client could sit
    //waiting for events it was never going to receive.
    on("join chat", async (room, ack) => {
      const joined = Boolean(await memberOf(room));

      if (joined) {
        socket.join(room);
      }

      if (typeof ack === "function") ack({ joined });
    });

    //Typing indicators used to broadcast with no membership check at all, so
    //any authenticated user could spray them into any chat by id
    on("typing", async (room) => {
      if (await memberOf(room)) {
        socket.to(room).emit("typing", { userId });
      }
    });

    on("stop typing", async (room) => {
      if (await memberOf(room)) {
        socket.to(room).emit("stop typing", { userId });
      }
    });

    //Which members of a chat are online right now. Acknowledged rather than
    //emitted back, so the caller can await it on mount.
    on("presence:list", async (chatId, ack) => {
      if (typeof ack !== "function") return;

      const chat = await memberOf(chatId);
      ack({ online: chat ? filterOnline(io, chat.users) : [] });
    });

    socket.on("disconnect", async () => {
      try {
        //socket.io has already removed this socket from its rooms by now, so
        //anything left means the user still has another tab open
        if (isUserOnline(io, userId)) return;

        await announcePresence(io, userId, false);
      } catch (error) {
        console.error("presence cleanup failed:", error.message);
      }
    });

    //Every listener is attached; it is now safe for the client to talk to us
    socket.emit("connected");

    //Announce presence after the handshake rather than awaiting it above, so
    //a slow query cannot delay the client becoming usable. Only the first
    //connection is news - a second tab changes nothing.
    const isFirstConnection =
      (io.sockets.adapter.rooms.get(userId)?.size ?? 0) === 1;

    if (isFirstConnection) {
      announcePresence(io, userId, true).catch((error) =>
        console.error("presence announce failed:", error.message)
      );
    }
  });
};

module.exports = registerSocketHandlers;

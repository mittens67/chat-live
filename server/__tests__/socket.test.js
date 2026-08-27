const http = require("node:http");
const request = require("supertest");
const { io: ioClient } = require("socket.io-client");
const { Server } = require("socket.io");
const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  loadApp,
} = require("./setup");

let app;
let httpServer;
let io;
let baseUrl;

beforeAll(connectTestDB);
afterAll(disconnectTestDB);

/**
 * A fresh server per test.
 *
 * Sharing one io instance across the file meant live connections, presence
 * rooms and reconnection attempts leaked between cases: tests passed alone and
 * hung in sequence. Booting on port 0 is cheap enough to buy real isolation.
 */
const startServer = async () => {
  app = loadApp();

  //server.js normally does this wiring; rebuild it here so the socket layer is
  //actually exercised rather than assumed
  const registerSocketHandlers = require("../socket");
  httpServer = http.createServer(app);
  io = new Server(httpServer);
  app.set("io", io);
  registerSocketHandlers(io);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  baseUrl = `http://localhost:${httpServer.address().port}`;
};

const stopServer = async () => {
  //io.close() also closes the http server it was attached to, and calls back
  //once its engine has shut down. Closing both separately left engine timers
  //running, which is what leaked between tests.
  await new Promise((resolve) => io.close(resolve));
};

const makeUser = async (name) => {
  const { body } = await request(app).post("/api/user").send({
    name,
    email: `${name.toLowerCase()}@example.com`,
    password: "correct-horse-battery",
  });
  return body;
};

const as = (token) => ({ Authorization: `Bearer ${token}` });

/** Connects a socket and resolves once the server acknowledges it. */
const connect = (token) =>
  new Promise((resolve, reject) => {
    const socket = ioClient(baseUrl, {
      auth: { token },
      transports: ["websocket"],
      forceNew: true,
      //Without this, a socket rejected at the handshake retries forever in the
      //background. Those retries accumulate across the suite and eventually
      //starve later tests of connections.
      reconnection: false,
    });
    socket.on("connected", () => resolve(socket));
    socket.on("connect_error", (error) => {
      socket.close();
      reject(error);
    });
  });

/** Resolves with the event payload, or rejects if it never arrives. */
const waitFor = (socket, event, timeout = 2000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for "${event}"`)),
      timeout
    );
    socket.once(event, (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

/** Joins a chat room and resolves with the server's acknowledgement. */
const joinChat = (socket, chatId) =>
  new Promise((resolve) => socket.emit("join chat", chatId, resolve));

/** Asserts an event does NOT arrive within the window. */
const expectNoEvent = (socket, event, window = 600) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, window);
    socket.once(event, (payload) => {
      clearTimeout(timer);
      reject(new Error(`unexpectedly received "${event}": ${JSON.stringify(payload)}`));
    });
  });

describe("socket layer", () => {
  let alice;
  let bob;
  let mallory;
  let chatId;
  const sockets = [];

  const track = async (token) => {
    const socket = await connect(token);
    sockets.push(socket);
    return socket;
  };

  beforeEach(async () => {
    await startServer();

    alice = await makeUser("Alice");
    bob = await makeUser("Bob");
    mallory = await makeUser("Mallory");

    const { body } = await request(app)
      .post("/api/chat")
      .set(as(alice.token))
      .send({ userId: bob._id });

    chatId = body._id;
  });

  afterEach(async () => {
    sockets.splice(0).forEach((socket) => socket.close());
    await stopServer();
    await clearTestDB();
  });

  describe("handshake authentication", () => {
    it("rejects a connection with no token", async () => {
      await expect(connect(undefined)).rejects.toThrow(/authentication/i);
    });

    it("rejects a forged token", async () => {
      await expect(connect("not-a-real-jwt")).rejects.toThrow(/invalid/i);
    });

    it("accepts a valid token", async () => {
      const socket = await track(alice.token);
      expect(socket.connected).toBe(true);
    });

    //Flagged so the client can stop reconnecting. Without it a rejected token
    //retries forever, and every attempt costs a database lookup here.
    it("marks a rejected handshake as an auth failure", async () => {
      const error = await connect("not-a-real-jwt").catch((e) => e);

      expect(error.data).toEqual({ code: "AUTH_FAILED" });
    });
  });

  describe("message delivery", () => {
    it("delivers a posted message to the other member", async () => {
      const bobSocket = await track(bob.token);
      const received = waitFor(bobSocket, "message recieved");

      await request(app)
        .post("/api/message")
        .set(as(alice.token))
        .send({ content: "hello bob", chatId });

      const message = await received;
      expect(message.content).toBe("hello bob");
      expect(message.sender._id).toBe(alice._id);
      expect(message.type).toBe("text");
    });

    it("does not echo the message back to its sender", async () => {
      const aliceSocket = await track(alice.token);

      await request(app)
        .post("/api/message")
        .set(as(alice.token))
        .send({ content: "hello", chatId });

      //The sender already has it from the HTTP response
      await expectNoEvent(aliceSocket, "message recieved");
    });

    it("does not deliver to someone outside the chat", async () => {
      const mallorySocket = await track(mallory.token);

      await request(app)
        .post("/api/message")
        .set(as(alice.token))
        .send({ content: "private", chatId });

      await expectNoEvent(mallorySocket, "message recieved");
    });

    /**
     * The core of the change: the server used to re-broadcast whatever the
     * sender's client emitted, so a modified client could forge the body, the
     * sender, or an "ai-response" bubble. There is no longer a handler at all.
     */
    it("ignores a message emitted directly by a client", async () => {
      const bobSocket = await track(bob.token);
      const mallorySocket = await track(mallory.token);

      mallorySocket.emit("new message", {
        content: "forged by mallory",
        type: "ai-response",
        sender: { _id: alice._id, name: "Alice" },
        chat: { _id: chatId },
      });

      await expectNoEvent(bobSocket, "message recieved");
    });
  });

  describe("typing indicators", () => {
    it("relays typing to other members of the chat", async () => {
      const aliceSocket = await track(alice.token);
      const bobSocket = await track(bob.token);

      expect(await joinChat(bobSocket, chatId)).toEqual({ joined: true });

      const typing = waitFor(bobSocket, "typing");
      aliceSocket.emit("typing", chatId);

      expect(await typing).toEqual({ userId: alice._id });
    });

    //These used to broadcast with no membership check, so anyone could spray
    //typing indicators into any chat whose id they had
    it("ignores typing from a non-member", async () => {
      const bobSocket = await track(bob.token);
      const mallorySocket = await track(mallory.token);

      await joinChat(bobSocket, chatId);

      mallorySocket.emit("typing", chatId);

      await expectNoEvent(bobSocket, "typing");
    });

    it("does not let a non-member join a chat room", async () => {
      const aliceSocket = await track(alice.token);
      const mallorySocket = await track(mallory.token);

      expect(await joinChat(mallorySocket, chatId)).toEqual({ joined: false });

      //And having been refused, she receives nothing sent to that room
      aliceSocket.emit("typing", chatId);
      await expectNoEvent(mallorySocket, "typing");
    });
  });

  describe("presence", () => {
    it("tells contacts when someone comes online", async () => {
      const bobSocket = await track(bob.token);
      const online = waitFor(bobSocket, "presence:online");

      await track(alice.token);

      expect(await online).toEqual({ userId: alice._id });
    });

    it("tells contacts when someone goes offline", async () => {
      const bobSocket = await track(bob.token);

      //Wait until Alice is fully online before dropping her, otherwise the
      //disconnect races the server's own connection bookkeeping
      const online = waitFor(bobSocket, "presence:online");
      const aliceSocket = await connect(alice.token);
      await online;

      const offline = waitFor(bobSocket, "presence:offline");
      aliceSocket.disconnect();

      expect(await offline).toEqual({ userId: alice._id });
    });

    it("does not announce presence to strangers", async () => {
      const mallorySocket = await track(mallory.token);

      await track(alice.token);

      await expectNoEvent(mallorySocket, "presence:online");
    });

    it("reports which members of a chat are online", async () => {
      const aliceSocket = await track(alice.token);
      await track(bob.token);

      const result = await new Promise((resolve) =>
        aliceSocket.emit("presence:list", chatId, resolve)
      );

      expect(result.online).toEqual(
        expect.arrayContaining([alice._id, bob._id])
      );
    });

    it("reports nothing for a chat the caller is not in", async () => {
      const mallorySocket = await track(mallory.token);

      const result = await new Promise((resolve) =>
        mallorySocket.emit("presence:list", chatId, resolve)
      );

      expect(result.online).toEqual([]);
    });
  });
});

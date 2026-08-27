const request = require("supertest");
const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  loadApp,
} = require("./setup");

let app;

const CLOUD_NAME = "test-cloud";
const cloudinaryUrl = (path) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/v1/${path}`;

beforeAll(async () => {
  await connectTestDB();
  process.env.CLOUDINARY_CLOUD_NAME = CLOUD_NAME;
  app = loadApp();
});

afterAll(async () => {
  delete process.env.CLOUDINARY_CLOUD_NAME;
  await disconnectTestDB();
});

afterEach(clearTestDB);

const makeUser = async (name) => {
  const { body } = await request(app).post("/api/user").send({
    name,
    email: `${name.toLowerCase()}@example.com`,
    password: "correct-horse-battery",
  });
  return body;
};

const as = (token) => ({ Authorization: `Bearer ${token}` });

describe("typed messages", () => {
  let alice;
  let bob;
  let chatId;

  beforeEach(async () => {
    alice = await makeUser("Alice");
    bob = await makeUser("Bob");

    const { body } = await request(app)
      .post("/api/chat")
      .set(as(alice.token))
      .send({ userId: bob._id });

    chatId = body._id;
  });

  const send = (payload) =>
    request(app).post("/api/message").set(as(alice.token)).send(payload);

  describe("types a client may not claim", () => {
    /**
     * The whole point of the type field is that the client cannot forge these.
     * An "ai-response" a client could set would let anyone put words in the
     * assistant's mouth in a chat they belong to.
     */
    it("rejects ai-response", async () => {
      const res = await send({
        content: "I am definitely the AI",
        type: "ai-response",
        chatId,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/unsupported message type/i);
    });

    it("rejects call-event", async () => {
      const res = await send({
        content: "Alice started a call",
        type: "call-event",
        chatId,
      });

      expect(res.status).toBe(400);
    });

    it("rejects a type that is not in the enum at all", async () => {
      const res = await send({ content: "hi", type: "banana", chatId });

      expect(res.status).toBe(400);
    });
  });

  describe("attachment URLs", () => {
    it("stores an attachment pointing at our own Cloudinary account", async () => {
      const res = await send({
        content: cloudinaryUrl("cat.jpg"),
        type: "image",
        chatId,
      });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe("image");
    });

    /**
     * Any https URL used to be accepted, persisted, and rendered into an
     * <img src> on every recipient's screen - an outbound request to a host the
     * sender controls.
     */
    it("rejects an attachment hosted somewhere else", async () => {
      const res = await send({
        content: "https://evil.example.com/tracker.jpg",
        type: "image",
        chatId,
      });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/uploaded file url/i);
    });

    it("rejects another Cloudinary account's media", async () => {
      const res = await send({
        content: "https://res.cloudinary.com/someone-else/image/upload/v1/x.jpg",
        type: "image",
        chatId,
      });

      expect(res.status).toBe(400);
    });

    it("rejects a non-http scheme", async () => {
      const res = await send({
        content: "javascript:alert(1)",
        type: "image",
        chatId,
      });

      expect(res.status).toBe(400);
    });

    it("does not apply URL rules to ordinary text", async () => {
      const res = await send({
        content: "look at https://evil.example.com/tracker.jpg",
        type: "text",
        chatId,
      });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe("text");
    });
  });

  describe("back-compat for clients that send no type", () => {
    it("treats prose as text", async () => {
      const res = await send({ content: "just talking", chatId });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe("text");
    });

    it("infers image from an uploaded image URL", async () => {
      const res = await send({ content: cloudinaryUrl("cat.png"), chatId });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe("image");
    });

    it("infers video from an uploaded video URL", async () => {
      const res = await send({ content: cloudinaryUrl("clip.mp4"), chatId });

      expect(res.status).toBe(201);
      expect(res.body.type).toBe("video");
    });

    //An inferred attachment type still has to survive the URL check, or the
    //back-compat path would be a way around it
    it("still rejects an inferred attachment from another host", async () => {
      const res = await send({
        content: "https://evil.example.com/tracker.png",
        chatId,
      });

      expect(res.status).toBe(400);
    });
  });

  describe("when attachment storage is not configured", () => {
    beforeEach(() => {
      delete process.env.CLOUDINARY_CLOUD_NAME;
    });

    afterEach(() => {
      process.env.CLOUDINARY_CLOUD_NAME = CLOUD_NAME;
    });

    it("refuses attachments rather than storing an unvalidated URL", async () => {
      const res = await send({
        content: cloudinaryUrl("cat.jpg"),
        type: "image",
        chatId,
      });

      expect(res.status).toBe(503);
    });

    it("still accepts plain text", async () => {
      const res = await send({ content: "hello", chatId });

      expect(res.status).toBe(201);
    });
  });
});

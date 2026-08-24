const request = require("supertest");
const {
  connectTestDB,
  disconnectTestDB,
  clearTestDB,
  loadApp,
} = require("./setup");

let app;

beforeAll(async () => {
  await connectTestDB();
  app = loadApp();
});

afterAll(disconnectTestDB);
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

/**
 * These are the holes the audit found: `protect` established identity but
 * nothing checked whether the caller was allowed to touch the resource.
 */
describe("chat and message authorization", () => {
  let alice;
  let bob;
  let mallory;
  let chatId;

  beforeEach(async () => {
    alice = await makeUser("Alice");
    bob = await makeUser("Bob");
    mallory = await makeUser("Mallory");

    const { body } = await request(app)
      .post("/api/chat")
      .set(as(alice.token))
      .send({ userId: bob._id });

    chatId = body._id;

    await request(app)
      .post("/api/message")
      .set(as(alice.token))
      .send({ content: "private message", chatId });
  });

  it("lets a member read the chat's messages", async () => {
    const res = await request(app)
      .get(`/api/message/${chatId}`)
      .set(as(bob.token));

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it("stops a non-member reading the chat's messages", async () => {
    const res = await request(app)
      .get(`/api/message/${chatId}`)
      .set(as(mallory.token));

    expect(res.status).toBe(404);
    expect(JSON.stringify(res.body)).not.toContain("private message");
  });

  it("stops a non-member posting into the chat", async () => {
    const res = await request(app)
      .post("/api/message")
      .set(as(mallory.token))
      .send({ content: "injected", chatId });

    expect(res.status).toBe(404);
  });

  it("rejects a malformed chat id with 400, not 500", async () => {
    const res = await request(app)
      .get("/api/message/not-an-object-id")
      .set(as(alice.token));

    expect(res.status).toBe(400);
  });

  it("rejects an empty message", async () => {
    const res = await request(app)
      .post("/api/message")
      .set(as(alice.token))
      .send({ content: "   ", chatId });

    expect(res.status).toBe(400);
  });

  it("stamps messages with createdAt", async () => {
    //Regression guard for the `timeStamps` typo, which meant no message ever
    //had a creation time
    const res = await request(app)
      .get(`/api/message/${chatId}`)
      .set(as(alice.token));

    expect(res.body[0].createdAt).toBeTruthy();
  });
});

describe("group chat admin authorization", () => {
  let alice;
  let bob;
  let mallory;
  let groupId;

  beforeEach(async () => {
    alice = await makeUser("Alice");
    bob = await makeUser("Bob");
    mallory = await makeUser("Mallory");

    const { body } = await request(app)
      .post("/api/chat/group")
      .set(as(alice.token))
      .send({ name: "Test Group", users: [bob._id, mallory._id] });

    groupId = body._id;
  });

  it("makes the creator the admin", async () => {
    const res = await request(app).get("/api/chat").set(as(alice.token));
    const group = res.body.find((c) => c._id === groupId);

    expect(group.groupAdmin._id).toBe(alice._id);
  });

  it("lets the admin rename the group", async () => {
    const res = await request(app)
      .put("/api/chat/rename")
      .set(as(alice.token))
      .send({ chatId: groupId, chatName: "Renamed" });

    expect(res.status).toBe(200);
    expect(res.body.chatName).toBe("Renamed");
  });

  it("stops a non-admin renaming the group", async () => {
    const res = await request(app)
      .put("/api/chat/rename")
      .set(as(bob.token))
      .send({ chatId: groupId, chatName: "Hacked" });

    expect(res.status).toBe(403);
  });

  it("stops a non-admin adding members", async () => {
    const carol = await makeUser("Carol");

    const res = await request(app)
      .put("/api/chat/groupadd")
      .set(as(bob.token))
      .send({ chatId: groupId, userId: carol._id });

    expect(res.status).toBe(403);
  });

  it("stops a non-admin removing the admin", async () => {
    const res = await request(app)
      .put("/api/chat/groupremove")
      .set(as(mallory.token))
      .send({ chatId: groupId, userId: alice._id });

    expect(res.status).toBe(403);
  });

  it("lets a member remove themselves", async () => {
    const res = await request(app)
      .put("/api/chat/groupremove")
      .set(as(mallory.token))
      .send({ chatId: groupId, userId: mallory._id });

    expect(res.status).toBe(200);
    expect(res.body.users.some((u) => u._id === mallory._id)).toBe(false);
  });

  it("stops an outsider touching the group at all", async () => {
    const outsider = await makeUser("Outsider");

    const res = await request(app)
      .put("/api/chat/rename")
      .set(as(outsider.token))
      .send({ chatId: groupId, chatName: "Hacked" });

    //404, not 403 - an outsider should not learn the group exists
    expect(res.status).toBe(404);
  });

  it("does not duplicate a member added twice", async () => {
    const carol = await makeUser("Carol");
    const payload = { chatId: groupId, userId: carol._id };

    await request(app).put("/api/chat/groupadd").set(as(alice.token)).send(payload);
    const res = await request(app)
      .put("/api/chat/groupadd")
      .set(as(alice.token))
      .send(payload);

    const occurrences = res.body.users.filter((u) => u._id === carol._id);
    expect(occurrences).toHaveLength(1);
  });

  it("requires at least two other members", async () => {
    const res = await request(app)
      .post("/api/chat/group")
      .set(as(alice.token))
      .send({ name: "Too Small", users: [bob._id] });

    expect(res.status).toBe(400);
  });

  it("rejects a malformed users payload with 400, not 500", async () => {
    const res = await request(app)
      .post("/api/chat/group")
      .set(as(alice.token))
      .send({ name: "Bad", users: "not-json" });

    expect(res.status).toBe(400);
  });
});

describe("one-to-one chat access", () => {
  it("returns the same chat instead of creating a duplicate", async () => {
    const alice = await makeUser("Alice");
    const bob = await makeUser("Bob");

    const first = await request(app)
      .post("/api/chat")
      .set(as(alice.token))
      .send({ userId: bob._id });

    const second = await request(app)
      .post("/api/chat")
      .set(as(bob.token))
      .send({ userId: alice._id });

    expect(second.body._id).toBe(first.body._id);
  });

  it("refuses a chat with yourself", async () => {
    const alice = await makeUser("Alice");

    const res = await request(app)
      .post("/api/chat")
      .set(as(alice.token))
      .send({ userId: alice._id });

    expect(res.status).toBe(400);
  });

  it("only lists chats you belong to", async () => {
    const alice = await makeUser("Alice");
    const bob = await makeUser("Bob");
    const mallory = await makeUser("Mallory");

    await request(app)
      .post("/api/chat")
      .set(as(alice.token))
      .send({ userId: bob._id });

    const res = await request(app).get("/api/chat").set(as(mallory.token));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

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

const VALID_USER = {
  name: "Alice",
  email: "alice@example.com",
  password: "correct-horse-battery",
};

describe("POST /api/user (register)", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app).post("/api/user").send(VALID_USER);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.email).toBe("alice@example.com");
  });

  it("never returns the password hash", async () => {
    const res = await request(app).post("/api/user").send(VALID_USER);

    expect(res.body).not.toHaveProperty("password");
    expect(JSON.stringify(res.body)).not.toContain("$2");
  });

  it("rejects a password under 8 characters", async () => {
    const res = await request(app)
      .post("/api/user")
      .send({ ...VALID_USER, password: "short" });

    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email", async () => {
    await request(app).post("/api/user").send(VALID_USER);
    const res = await request(app).post("/api/user").send(VALID_USER);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("treats email as case-insensitive", async () => {
    await request(app).post("/api/user").send(VALID_USER);
    const res = await request(app)
      .post("/api/user")
      .send({ ...VALID_USER, email: "ALICE@example.com" });

    expect(res.status).toBe(400);
  });

  it("requires all fields", async () => {
    const res = await request(app)
      .post("/api/user")
      .send({ email: "a@b.com" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/user/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/user").send(VALID_USER);
  });

  it("logs in with correct credentials", async () => {
    //Regression guard: password is select:false on the schema, so this only
    //works because authUser explicitly asks for it
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: VALID_USER.email, password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: "nobody@example.com", password: "whatever-long" });

    expect(res.status).toBe(401);
  });

  it("never returns the password hash", async () => {
    const res = await request(app)
      .post("/api/user/login")
      .send({ email: VALID_USER.email, password: VALID_USER.password });

    expect(res.body).not.toHaveProperty("password");
  });
});

describe("protect middleware", () => {
  it("rejects a request with no token", async () => {
    const res = await request(app).get("/api/chat");
    expect(res.status).toBe(401);
  });

  it("rejects a malformed token", async () => {
    const res = await request(app)
      .get("/api/chat")
      .set("Authorization", "Bearer not.a.real.token");

    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const jwt = require("jsonwebtoken");
    const forged = jwt.sign({ id: "507f1f77bcf86cd799439011" }, "wrong-secret");

    const res = await request(app)
      .get("/api/chat")
      .set("Authorization", `Bearer ${forged}`);

    expect(res.status).toBe(401);
  });

  it("rejects a valid token for a deleted user", async () => {
    const { body } = await request(app).post("/api/user").send(VALID_USER);
    await clearTestDB();

    const res = await request(app)
      .get("/api/chat")
      .set("Authorization", `Bearer ${body.token}`);

    expect(res.status).toBe(401);
  });
});

describe("GET /api/user (search)", () => {
  let token;

  beforeEach(async () => {
    const { body } = await request(app).post("/api/user").send(VALID_USER);
    token = body.token;
    await request(app).post("/api/user").send({
      name: "Bob",
      email: "bob@example.com",
      password: "correct-horse-battery",
    });
  });

  it("never leaks password hashes", async () => {
    const res = await request(app)
      .get("/api/user")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain("password");
    expect(JSON.stringify(res.body)).not.toContain("$2");
  });

  it("excludes the requesting user", async () => {
    const res = await request(app)
      .get("/api/user")
      .set("Authorization", `Bearer ${token}`);

    expect(res.body.every((u) => u.email !== VALID_USER.email)).toBe(true);
  });

  it("treats a regex payload as literal text", async () => {
    //Unescaped this would compile to a catastrophically backtracking pattern
    const res = await request(app)
      .get("/api/user")
      .query({ search: "(a+)+$" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("finds a user by name", async () => {
    const res = await request(app)
      .get("/api/user")
      .query({ search: "Bob" })
      .set("Authorization", `Bearer ${token}`);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Bob");
  });
});

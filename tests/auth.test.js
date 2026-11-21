const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");

process.env.FRONTEND_URL = "http://localhost:5500";

const app = require("../server");

let server;
let apiBase;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  apiBase = `http://127.0.0.1:${server.address().port}/api`;
});

after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function login(username, password) {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return { response, body: await response.json() };
}

test("CORS allows configured frontend origin and required preflight headers", async () => {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5500",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,authorization",
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-origin"), "http://localhost:5500");
  assert.equal(response.headers.get("access-control-allow-credentials"), "true");
  assert.match(response.headers.get("access-control-allow-methods"), /GET/);
  assert.match(response.headers.get("access-control-allow-methods"), /POST/);
  assert.match(response.headers.get("access-control-allow-methods"), /PATCH/);
  assert.match(response.headers.get("access-control-allow-methods"), /DELETE/);
  assert.match(response.headers.get("access-control-allow-methods"), /OPTIONS/);
  assert.equal(response.headers.get("access-control-allow-headers"), "Content-Type,Authorization");
});

test("CORS does not reflect an unconfigured origin", async () => {
  const response = await fetch(`${apiBase}/auth/login`, {
    method: "OPTIONS",
    headers: {
      Origin: "https://untrusted.example",
      "Access-Control-Request-Method": "POST",
    },
  });

  assert.equal(response.headers.get("access-control-allow-origin"), null);
});

test("configured citizen and officer credentials receive role-specific tokens", async () => {
  require("dotenv").config();
  const citizen = await login(
    process.env.DEMO_CITIZEN_USERNAME || "citizen@civiclens.org",
    process.env.DEMO_CITIZEN_PASSWORD || "citizen123"
  );
  const officer = await login(
    process.env.DEMO_OFFICER_USERNAME || "officer@civiclens.gov",
    process.env.DEMO_OFFICER_PASSWORD || "officer123"
  );

  assert.equal(citizen.response.status, 200);
  assert.equal(citizen.body.data.user.role, "CITIZEN");
  assert.ok(citizen.body.data.token);
  assert.equal(officer.response.status, 200);
  assert.equal(officer.body.data.user.role, "MUNICIPAL_OFFICER");
  assert.ok(officer.body.data.token);
});

test("invalid credentials are rejected with a useful JSON error", async () => {
  const result = await login(
    process.env.DEMO_CITIZEN_USERNAME || "citizen@civiclens.org",
    "incorrect-test-password"
  );

  assert.equal(result.response.status, 401);
  assert.deepEqual(result.body, { success: false, error: "Invalid credentials" });
});

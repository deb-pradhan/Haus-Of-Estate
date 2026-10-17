import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "../../src/app/api/health/route.ts";

test("shallow health check is 200 JSON with only status + time, uncached", async () => {
  const res = await GET(new Request("http://localhost/api/health"));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  const body = await res.json();
  assert.deepEqual(Object.keys(body).sort(), ["status", "time"]);
  assert.equal(body.status, "ok");
  assert.ok(!Number.isNaN(Date.parse(body.time)));
});

test("health response never contains secrets or connection info", async () => {
  process.env.DATABASE_URL = "postgresql://user:hunter2@db.internal:5432/app";
  const res = await GET(new Request("http://localhost/api/health"));
  const text = await res.text();
  assert.ok(!/hunter2|db\.internal|postgres/i.test(text));
});

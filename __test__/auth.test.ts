import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { bearerAuth } from "../src/auth.js";

const originalEnv = process.env;

describe("bearerAuth", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("passes through when MCP_API_KEY is not set (dev mode)", async () => {
    delete process.env.MCP_API_KEY;
    const app = new Hono();
    app.use("*", bearerAuth);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  test("passes through with valid Bearer token", async () => {
    process.env.MCP_API_KEY = "test-key";
    const app = new Hono();
    app.use("*", bearerAuth);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      headers: { Authorization: "Bearer test-key" },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });

  test("returns 401 with invalid Bearer token", async () => {
    process.env.MCP_API_KEY = "test-key";
    const app = new Hono();
    app.use("*", bearerAuth);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      headers: { Authorization: "Bearer wrong" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Unauthorized" },
      id: null,
    });
  });

  test("returns 401 when Authorization header is missing", async () => {
    process.env.MCP_API_KEY = "test-key";
    const app = new Hono();
    app.use("*", bearerAuth);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test");
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Unauthorized" },
      id: null,
    });
  });

  test("returns 401 with wrong authentication scheme", async () => {
    process.env.MCP_API_KEY = "test-key";
    const app = new Hono();
    app.use("*", bearerAuth);
    app.get("/test", (c) => c.json({ ok: true }));

    const res = await app.request("/test", {
      headers: { Authorization: "Basic abc" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body).toEqual({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Unauthorized" },
      id: null,
    });
  });
});

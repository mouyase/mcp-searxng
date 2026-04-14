import type { MiddlewareHandler } from "hono";

const AUTH_HEADER = "Authorization";
const BEARER_PREFIX = "Bearer ";
const REALM = "MCP";

function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export const bearerAuth: MiddlewareHandler = async (c, next) => {
  const apiKey = process.env.MCP_API_KEY;

  if (!apiKey) {
    return next();
  }

  const authHeader = c.req.header(AUTH_HEADER);

  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    return c.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Unauthorized" }, id: null },
      401,
      {
        "WWW-Authenticate": `Bearer realm="${REALM}"`,
        "Content-Type": "application/json",
      },
    );
  }

  const token = authHeader.slice(BEARER_PREFIX.length);

  if (!constantTimeCompare(token, apiKey)) {
    return c.json(
      { jsonrpc: "2.0", error: { code: -32000, message: "Unauthorized" }, id: null },
      401,
      {
        "WWW-Authenticate": `Bearer realm="${REALM}"`,
        "Content-Type": "application/json",
      },
    );
  }

  return next();
};

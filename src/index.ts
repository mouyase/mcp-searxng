import { Hono } from "hono";
import { cors } from "hono/cors";
import { bearerAuth } from "./auth.js";
import { createMcpServer } from "./mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "mcp-session-id",
      "Last-Event-ID",
      "mcp-protocol-version",
    ],
    exposeHeaders: ["mcp-session-id", "mcp-protocol-version"],
    maxAge: 86400,
  }),
);

app.use("*", bearerAuth);

const mcpServer = createMcpServer();

app.all("/mcp", async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await mcpServer.connect(transport);
  const response = await transport.handleRequest(c.req.raw);
  await transport.close();
  return response;
});

const port = Number(process.env.PORT) || 3000;

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`MCP SearXNG server running on http://localhost:${port}/mcp`);

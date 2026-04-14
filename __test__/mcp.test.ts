import { describe, test, expect } from "bun:test";
import { createMcpServer } from "../src/mcp.js";

describe("createMcpServer", () => {
  test("returns an McpServer instance", () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
    expect(typeof server).toBe("object");
  });

  test("registers the search tool", () => {
    const server = createMcpServer();
    const registeredTools = Reflect.get(server, "_registeredTools") as Record<string, unknown>;
    expect(Object.hasOwn(registeredTools, "search")).toBe(true);
  });
});

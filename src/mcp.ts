import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchSearXNG, type SearXNGResponse } from "./searxng.js";

export function createMcpServer() {
  const server = new McpServer({
    name: "mcp-searxng",
    version: "1.0.0",
  });

  server.tool(
    "search",
    "Search the web using SearXNG meta-search engine. Returns search results with titles, URLs, and content snippets.",
    {
      query: z.string().describe("Search query string"),
      categories: z
        .string()
        .optional()
        .describe("Comma-separated category filter (e.g., 'general', 'images', 'news', 'it')"),
      engines: z
        .string()
        .optional()
        .describe("Comma-separated engine filter (e.g., 'google', 'duckduckgo', 'wikipedia')"),
      language: z.string().optional().describe("Search language code (e.g., 'en', 'zh', 'de')"),
      time_range: z
        .enum(["day", "month", "year"])
        .optional()
        .describe("Filter results by time range"),
      pageno: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Page number for pagination (starts at 1)"),
    },
    async (args) => {
      try {
        const response: SearXNGResponse = await searchSearXNG(args);

        const lines: string[] = [
          `Query: ${response.query}`,
          `Number of results: ${response.resultCount}`,
          "",
          "--- Results ---",
          "",
        ];

        for (const result of response.results) {
          lines.push(`Title: ${result.title}`);
          lines.push(`URL: ${result.url}`);
          lines.push(`Content: ${result.content}`);
          lines.push(`Engine: ${result.engine}`);
          lines.push(`Score: ${result.score}`);
          lines.push("");
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return {
          content: [{ type: "text" as const, text: "Search error: " + message }],
          isError: true as const,
        };
      }
    },
  );

  return server;
}

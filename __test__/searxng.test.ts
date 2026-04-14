import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { searchSearXNG } from "../src/searxng.js";

const originalFetch = globalThis.fetch;
const originalEnv = process.env;

const mockData = {
  query: "test",
  number_of_results: 2,
  results: [
    {
      url: "https://example.com",
      title: "Example",
      content: "Test content",
      engine: "google",
      score: 1.5,
      category: "general",
      engines: ["google"],
    },
  ],
  suggestions: ["test suggestion"],
  unresponsive_engines: [],
};

function createMockFetch(response: Response): typeof fetch {
  const fn = () => Promise.resolve(response);
  return fn as unknown as typeof fetch;
}

describe("searchSearXNG", () => {
  beforeEach(() => {
    globalThis.fetch = createMockFetch(new Response(JSON.stringify(mockData), { status: 200 }));
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  test("successful search returns parsed result with expected structure", async () => {
    process.env.SEARXNG_URL = "https://searxng.example.com";
    const result = await searchSearXNG({ query: "test" });
    expect(result).toEqual({
      query: "test",
      number_of_results: 2,
      results: [
        {
          url: "https://example.com",
          title: "Example",
          content: "Test content",
          engine: "google",
          score: 1.5,
          category: "general",
          engines: ["google"],
        },
      ],
      suggestions: ["test suggestion"],
      unresponsive_engines: [],
    });
  });

  test("throws error when SEARXNG_URL is missing", async () => {
    delete process.env.SEARXNG_URL;
    await expect(searchSearXNG({ query: "test" })).rejects.toThrow("SEARXNG_URL");
  });

  test("throws error on non-200 response", async () => {
    process.env.SEARXNG_URL = "https://searxng.example.com";
    globalThis.fetch = createMockFetch(
      new Response(null, { status: 500, statusText: "Internal Server Error" }),
    );
    await expect(searchSearXNG({ query: "test" })).rejects.toThrow("500");
  });

  test("throws error on invalid JSON response", async () => {
    process.env.SEARXNG_URL = "https://searxng.example.com";
    globalThis.fetch = createMockFetch(new Response("not json", { status: 200 }));
    await expect(searchSearXNG({ query: "test" })).rejects.toThrow("JSON");
  });

  test("throws error on unexpected response structure", async () => {
    process.env.SEARXNG_URL = "https://searxng.example.com";
    globalThis.fetch = createMockFetch(new Response('{"foo":"bar"}', { status: 200 }));
    await expect(searchSearXNG({ query: "test" })).rejects.toThrow("unexpected");
  });
});

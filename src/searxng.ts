export interface SearXNGSearchParams {
  query: string;
  categories?: string;
  engines?: string;
  language?: string;
  time_range?: "day" | "month" | "year";
  pageno?: number;
}

export interface SearXNGResult {
  url: string;
  title: string;
  content: string;
  engine: string;
  score: number;
  category: string;
  engines: string[];
  publishedDate?: string;
}

export interface SearXNGResponse {
  query: string;
  resultCount: number;
  results: SearXNGResult[];
}

export async function searchSearXNG(params: SearXNGSearchParams): Promise<SearXNGResponse> {
  const searxngUrl = process.env.SEARXNG_URL;

  if (!searxngUrl) {
    throw new Error("SEARXNG_URL environment variable is not set");
  }

  const url = new URL(searxngUrl);
  url.pathname = "/search";
  url.searchParams.set("format", "json");
  url.searchParams.set("q", params.query);

  if (params.categories) {
    url.searchParams.set("categories", params.categories);
  }

  if (params.engines) {
    url.searchParams.set("engines", params.engines);
  }

  if (params.language) {
    url.searchParams.set("language", params.language);
  }

  if (params.time_range) {
    url.searchParams.set("time_range", params.time_range);
  }

  if (params.pageno !== undefined) {
    url.searchParams.set("pageno", String(params.pageno));
  }

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    throw new Error(`SearXNG returned error status: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("Failed to parse SearXNG response as JSON");
  }

  if (typeof json !== "object" || json === null || !("query" in json) || !("results" in json)) {
    throw new Error("SearXNG response has an unexpected structure");
  }

  const raw = json as Record<string, unknown>;

  if (typeof raw.query !== "string") {
    throw new Error("SearXNG response is missing or has invalid 'query' field");
  }

  if (!Array.isArray(raw.results)) {
    throw new Error("SearXNG response is missing or has invalid 'results' field");
  }

  const results: SearXNGResult[] = raw.results.map((item): SearXNGResult => {
    if (typeof item !== "object" || item === null) {
      throw new Error("SearXNG result item is not an object");
    }

    const r = item as Record<string, unknown>;

    if (typeof r.url !== "string") {
      throw new Error("SearXNG result item is missing or has invalid 'url' field");
    }

    if (typeof r.title !== "string") {
      throw new Error("SearXNG result item is missing or has invalid 'title' field");
    }

    if (typeof r.content !== "string") {
      throw new Error("SearXNG result item is missing or has invalid 'content' field");
    }

    if (typeof r.engine !== "string") {
      throw new Error("SearXNG result item is missing or has invalid 'engine' field");
    }

    if (typeof r.score !== "number") {
      throw new Error("SearXNG result item is missing or has invalid 'score' field");
    }

    if (typeof r.category !== "string") {
      throw new Error("SearXNG result item is missing or has invalid 'category' field");
    }

    if (!Array.isArray(r.engines)) {
      throw new Error("SearXNG result item is missing or has invalid 'engines' field");
    }

    for (const eng of r.engines) {
      if (typeof eng !== "string") {
        throw new Error("SearXNG result item has non-string value in 'engines' array");
      }
    }

    return {
      url: r.url,
      title: r.title,
      content: r.content,
      engine: r.engine,
      score: r.score,
      category: r.category,
      engines: r.engines as string[],
      publishedDate: r.publishedDate !== undefined ? String(r.publishedDate) : undefined,
    };
  });

  return {
    query: raw.query,
    resultCount: results.length,
    results,
  };
}

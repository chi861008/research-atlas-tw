import { getCached, putCached } from "../../../lib/server-cache";
import { checkRateLimit } from "../../../lib/rate-limit";

const allowed = new Set(["search", "filter", "sort", "per-page", "select"]);

export async function GET(request: Request) {
  const rate = checkRateLimit(request, "openalex", 80);
  if (!rate.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: { "retry-after": String(rate.retryAfter) } });
  }
  const input = new URL(request.url);
  const query = new URLSearchParams();
  for (const [key, value] of input.searchParams) {
    if (allowed.has(key)) query.set(key, value.slice(0, 1800));
  }
  const perPage = Math.min(25, Math.max(1, Number(query.get("per-page")) || 8));
  query.set("per-page", String(perPage));
  if (!query.get("search")) return Response.json({ error: "search is required" }, { status: 400 });
  const cacheKey = `openalex:${query.toString()}`;
  const cached = await getCached(cacheKey);
  if (cached) return new Response(cached, { headers: { "content-type": "application/json", "x-cache": "hit" } });

  try {
    const response = await fetch(`https://api.openalex.org/works?${query}`, {
      headers: { "user-agent": "ResearchAtlas/1.0 (academic discovery proxy)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return Response.json({ error: "Academic index unavailable" }, { status: 502 });
    const body = await response.text();
    await putCached(cacheKey, body, 6 * 60 * 60 * 1000);
    return new Response(body, { headers: { "content-type": "application/json", "x-cache": "miss" } });
  } catch {
    return Response.json({ error: "Academic index timeout" }, { status: 504 });
  }
}

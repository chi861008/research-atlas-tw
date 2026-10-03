import { getCached, putCached } from "../../../lib/server-cache";
import { checkRateLimit } from "../../../lib/rate-limit";

const languages = new Set(["zh-TW", "zh", "en", "ja", "ko", "es", "fr", "de", "pt"]);

export async function GET(request: Request) {
  const rate = checkRateLimit(request, "translate", 100);
  if (!rate.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: { "retry-after": String(rate.retryAfter) } });
  }
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim().slice(0, 480);
  const from = url.searchParams.get("from") || "zh-TW";
  const to = url.searchParams.get("to") || "en";
  if (!q || !languages.has(from) || !languages.has(to)) {
    return Response.json({ error: "Invalid translation request" }, { status: 400 });
  }
  const cacheKey = `translation:${from}:${to}:${q}`;
  const cached = await getCached(cacheKey);
  if (cached) return Response.json({ responseData: { translatedText: cached }, cached: true });
  try {
    const endpoint = new URL("https://api.mymemory.translated.net/get");
    endpoint.searchParams.set("q", q);
    endpoint.searchParams.set("langpair", `${from}|${to}`);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("translation unavailable");
    const data = await response.json() as { responseData?: { translatedText?: string } };
    const translatedText = data.responseData?.translatedText?.trim();
    if (!translatedText) throw new Error("empty translation");
    await putCached(cacheKey, translatedText, 30 * 24 * 60 * 60 * 1000);
    return Response.json({ responseData: { translatedText }, cached: false });
  } catch {
    return Response.json({ error: "Translation unavailable" }, { status: 502 });
  }
}

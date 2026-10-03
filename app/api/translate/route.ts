import { getCached, putCached } from "../../../lib/server-cache";
import { checkRateLimit } from "../../../lib/rate-limit";

const languages = new Set(["zh-TW", "zh", "en", "ja", "ko", "es", "fr", "de", "pt"]);

async function translateWithMyMemory(q: string, from: string, to: string) {
  const endpoint = new URL("https://api.mymemory.translated.net/get");
  endpoint.searchParams.set("q", q);
  endpoint.searchParams.set("langpair", `${from}|${to}`);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("MyMemory unavailable");
  const data = await response.json() as { responseData?: { translatedText?: string }; responseStatus?: number };
  if (data.responseStatus && data.responseStatus >= 400) throw new Error("MyMemory quota reached");
  const translated = data.responseData?.translatedText?.trim();
  if (!translated || translated.startsWith("MYMEMORY WARNING:")) throw new Error("MyMemory empty");
  return translated;
}

async function translateWithGoogle(q: string, from: string, to: string) {
  const endpoint = new URL("https://translate.googleapis.com/translate_a/single");
  endpoint.searchParams.set("client", "gtx");
  endpoint.searchParams.set("sl", from);
  endpoint.searchParams.set("tl", to);
  endpoint.searchParams.set("dt", "t");
  endpoint.searchParams.set("q", q);
  const response = await fetch(endpoint, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Google translation unavailable");
  const data = await response.json() as unknown[];
  const translated = Array.isArray(data[0])
    ? (data[0] as unknown[][]).map((segment) => typeof segment?.[0] === "string" ? segment[0] : "").join("").trim()
    : "";
  if (!translated) throw new Error("Google translation empty");
  return translated;
}

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
    let translatedText: string;
    let provider: "mymemory" | "google" = "mymemory";
    try {
      translatedText = await translateWithMyMemory(q, from, to);
    } catch {
      translatedText = await translateWithGoogle(q, from, to);
      provider = "google";
    }
    await putCached(cacheKey, translatedText, 30 * 24 * 60 * 60 * 1000);
    return Response.json({ responseData: { translatedText }, cached: false, provider });
  } catch {
    return Response.json({ error: "Translation unavailable" }, { status: 502 });
  }
}

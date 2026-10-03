import { getCached, putCached } from "../../../lib/server-cache";
import { checkRateLimit } from "../../../lib/rate-limit";
import {
  TSSCI_2025,
  TSSCI_DOCUMENT_URL,
  TSSCI_EFFECTIVE_FROM,
  TSSCI_EFFECTIVE_TO,
  TSSCI_SOURCE_URL,
} from "../../../lib/tssci-2025";

type JournalInput = { key?: string; title?: string; issns?: string[] };
type MjlProduct = { productCode?: string; description?: string };
type MjlProfile = {
  issn?: string;
  eissn?: string;
  publicationTitle?: string;
  products?: MjlProduct[];
};

const MJL_URL = "https://mjl.clarivate.com/api/mjl/jprof/public/rank-search";
const MJL_HOME = "https://mjl.clarivate.com/home";
const HIGH_STANDARD = new Set(["SCIE", "SSCI", "TSSCI"]);

function normalizeTitle(value = "") {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replaceAll("臺", "台")
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
}

function normalizeIssn(value = "") {
  const clean = value.toUpperCase().replace(/[^0-9X]/g, "");
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : "";
}

function tssciMatch(title: string) {
  const normalized = normalizeTitle(title);
  if (!normalized) return null;
  return (
    TSSCI_2025.find((entry) =>
      entry.names.some((name) => normalizeTitle(name) === normalized),
    ) || null
  );
}

function productIndexes(products: MjlProduct[] = []) {
  const indexes = new Set<string>();
  for (const product of products) {
    if (product.productCode === "D") indexes.add("SCIE");
    if (product.productCode === "J" || product.productCode === "SS") indexes.add("SSCI");
    if (product.productCode === "H") indexes.add("AHCI");
    if (product.productCode === "EX") indexes.add("ESCI");
  }
  return [...indexes];
}

async function searchMjl(title: string, issns: string[]) {
  const searchValue = issns[0] || title;
  if (!searchValue) return { state: "not-listed" as const, indexes: [] as string[] };

  const response = await fetch(MJL_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer ",
      "x-1p-appId": "mjl",
      "user-agent": "ResearchAtlas/1.0 (journal index verification)",
    },
    body: JSON.stringify({
      searchValue,
      pageNum: 1,
      pageSize: 10,
      sortOrder: [{ name: "RELEVANCE", order: "DESC" }],
      filters: [
        {
          filterName: "COVERED_LATEST_JEDI",
          matchType: "BOOLEAN_EXACT",
          caseSensitive: false,
          values: [{ type: "VALUE", value: "true" }],
        },
        {
          filterName: "PRODUCT_CODE",
          matchType: "TEXT_EXACT",
          caseSensitive: false,
          values: ["D", "J", "SS", "H", "EX"].map((value) => ({
            type: "VALUE",
            value,
          })),
        },
      ],
      searchIdentifier: crypto.randomUUID(),
    }),
    signal: AbortSignal.timeout(9000),
  });

  if (!response.ok) throw new Error(`MJL ${response.status}`);
  const data = (await response.json()) as {
    journalProfiles?: Array<{ journalProfile?: MjlProfile }>;
  };
  const wantedIssns = new Set(issns.map(normalizeIssn).filter(Boolean));
  const wantedTitle = normalizeTitle(title);
  const exact = (data.journalProfiles || [])
    .map((item) => item.journalProfile)
    .filter((profile): profile is MjlProfile => Boolean(profile))
    .find((profile) => {
      const profileIssns = [profile.issn, profile.eissn]
        .map(normalizeIssn)
        .filter(Boolean);
      if (wantedIssns.size && profileIssns.some((issn) => wantedIssns.has(issn))) return true;
      return Boolean(wantedTitle && normalizeTitle(profile.publicationTitle) === wantedTitle);
    });

  if (!exact) return { state: "not-listed" as const, indexes: [] as string[] };
  return {
    state: "verified" as const,
    indexes: productIndexes(exact.products),
    matchedTitle: exact.publicationTitle || title,
    matchedIssns: [exact.issn, exact.eissn].map(normalizeIssn).filter(Boolean),
  };
}

async function verifyOne(input: JournalInput) {
  const title = String(input.title || "").trim().slice(0, 240);
  const issns = [...new Set((input.issns || []).map(normalizeIssn).filter(Boolean))].slice(0, 4);
  const key = String(input.key || issns[0] || title).slice(0, 300);
  const cacheKey = `journal-index:v3:${issns.sort().join(",")}:${normalizeTitle(title)}`;
  const cached = await getCached(cacheKey);
  if (cached) return { ...JSON.parse(cached), key, cached: true };

  const checkedAt = new Date().toISOString();
  const tssci = tssciMatch(title);
  let mjl: Awaited<ReturnType<typeof searchMjl>> | null = null;
  let mjlUnavailable = false;
  try {
    mjl = await searchMjl(title, issns);
  } catch {
    mjlUnavailable = true;
  }

  const indexes = new Set<string>(mjl?.indexes || []);
  if (tssci) indexes.add("TSSCI");
  const indexList = [...indexes];
  const verified = indexList.some((index) => HIGH_STANDARD.has(index));
  const state = verified
    ? "verified"
    : mjlUnavailable
      ? "unavailable"
      : indexList.length
        ? "other-index"
        : "not-listed";
  const result = {
    key,
    title,
    issns,
    indexes: indexList,
    verified,
    state,
    checkedAt,
    matchedTitle: mjl?.matchedTitle || tssci?.names[0] || "",
    matchedIssns: mjl?.matchedIssns || [],
    sources: [
      {
        id: "clarivate-mjl",
        label: "Clarivate Master Journal List",
        url: MJL_HOME,
        status: mjlUnavailable ? "unavailable" : mjl?.state || "not-listed",
      },
      {
        id: "tssci-2025",
        label: "2025 臺灣人文及社會科學期刊評比名單",
        url: TSSCI_SOURCE_URL,
        documentUrl: TSSCI_DOCUMENT_URL,
        status: tssci ? "verified" : "not-listed",
        effectiveFrom: TSSCI_EFFECTIVE_FROM,
        effectiveTo: TSSCI_EFFECTIVE_TO,
      },
    ],
    note: verified
      ? "已核驗期刊層級；單篇文章是否在其出版年度被 Web of Science 收錄，仍需以文章紀錄確認。"
      : mjlUnavailable
        ? "官方名錄暫時無法連線，因此不宣稱已核驗。"
        : "目前官方名錄未找到可精確比對的 SCIE、SSCI 或 TSSCI 紀錄。",
  };
  await putCached(cacheKey, JSON.stringify(result), mjlUnavailable ? 6 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000);
  return { ...result, cached: false };
}

export async function POST(request: Request) {
  const rate = checkRateLimit(request, "index-status", 20);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many requests" },
      { status: 429, headers: { "retry-after": String(rate.retryAfter) } },
    );
  }

  let body: { journals?: JournalInput[] };
  try {
    body = (await request.json()) as { journals?: JournalInput[] };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.journals) || body.journals.length > 50) {
    return Response.json({ error: "journals must contain 1 to 50 items" }, { status: 400 });
  }

  const inputs = body.journals.filter(
    (journal) => journal && (String(journal.title || "").trim() || journal.issns?.length),
  );
  const results = new Array(inputs.length);
  let cursor = 0;
  async function worker() {
    while (cursor < inputs.length) {
      const index = cursor++;
      results[index] = await verifyOne(inputs[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(5, inputs.length) }, () => worker()));
  return Response.json({ results, standard: "journal-level", checkedAt: new Date().toISOString() });
}
